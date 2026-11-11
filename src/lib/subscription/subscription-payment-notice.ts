import "server-only";

import { and, eq, inArray, isNull } from "drizzle-orm";

import { SubscriptionPaymentEmail } from "@/emails/templates/subscription-payment-email";
import { db } from "@/db";
import { billingReceipts, notifications, organizations, users } from "@/db/schema";
import { emailConfig } from "@/lib/email/config";
import { sendEmail } from "@/lib/email/send-email";
import { createUserNotifications } from "@/lib/postgres/features";
import type { RazorpayInvoiceResponse } from "@/lib/payments/razorpay-subscriptions";
import { formatReceiptAmount } from "@/lib/subscription/receipt-pdf";
import { getPlan } from "@/lib/subscription/plans";
import type { PlanId } from "@/types/subscription";

function paymentIdsFromInvoices(invoices: RazorpayInvoiceResponse[]): string[] {
  return [
    ...new Set(
      invoices
        .filter((invoice) => invoice.status?.toLowerCase() === "paid")
        .map((invoice) => invoice.payment_id?.trim() || "")
        .filter(Boolean)
    ),
  ];
}

function invoiceUrlFor(
  invoices: RazorpayInvoiceResponse[],
  paymentId: string
): string | null {
  const match = invoices.find((invoice) => invoice.payment_id?.trim() === paymentId);
  const url = match?.short_url?.trim();
  return url && /^https:\/\//i.test(url) ? url : null;
}

function formatWhen(value: Date | null | undefined): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

export async function notifySubscriptionPayments({
  organizationId,
  invoices,
  planId,
  billingInterval,
  subscriptionId,
  status,
  nextBillingDate,
  initialActivation,
}: {
  organizationId: string;
  invoices: RazorpayInvoiceResponse[];
  planId: PlanId;
  billingInterval: "monthly" | "yearly" | null;
  subscriptionId: string;
  status: string;
  nextBillingDate?: Date | null;
  initialActivation: boolean;
}): Promise<void> {
  const paymentIds = paymentIdsFromInvoices(invoices);
  if (paymentIds.length === 0 || !isPaidPlanId(planId)) return;

  const pending = await db
    .select()
    .from(billingReceipts)
    .where(
      and(
        eq(billingReceipts.organizationId, organizationId),
        inArray(billingReceipts.providerPaymentId, paymentIds),
        isNull(billingReceipts.confirmationSentAt)
      )
    );

  if (pending.length === 0) return;

  const [owner] = await db
    .select({
      userId: users.id,
      email: users.email,
      organizationName: organizations.name,
    })
    .from(organizations)
    .innerJoin(users, eq(users.id, organizations.ownerId))
    .where(eq(organizations.id, organizationId))
    .limit(1);

  if (!owner?.email?.trim()) {
    console.error("[subscription notice] organization owner email missing", {
      organizationId,
    });
    return;
  }

  const planName = getPlan(planId).name;
  const intervalLabel =
    billingInterval === "yearly" ? "Annual" : billingInterval === "monthly" ? "Monthly" : "—";
  const nextLabel =
    nextBillingDate && nextBillingDate.getTime() > Date.now()
      ? formatWhen(nextBillingDate)
      : null;

  for (const receipt of pending) {
    const recurring = !initialActivation;
    const paymentDate = formatWhen(receipt.paidAt) ?? formatWhen(new Date()) ?? "";
    const title = recurring ? "Payment received" : "Subscription Activated";
    const message = recurring
      ? `Your ${planName} subscription payment on ${paymentDate} was received.`
      : `Your ${planName} subscription is now active. Your church workspace has been upgraded successfully.`;

    const [already] = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, owner.userId),
          eq(notifications.type, "subscription"),
          eq(notifications.contentTitle, receipt.providerPaymentId)
        )
      )
      .limit(1);

    if (!already) {
      await createUserNotifications({
        userIds: [owner.userId],
        type: "subscription",
        organizationId,
        title,
        message,
        contentTitle: receipt.providerPaymentId,
      });
    }

    const result = await sendEmail({
      to: owner.email,
      subject: recurring
        ? "Your FaithConnectHub subscription payment was received"
        : "Your FaithConnectHub subscription is now active!",
      react: SubscriptionPaymentEmail({
        organizationName: owner.organizationName,
        planName,
        amount: formatReceiptAmount(receipt.amountMinor, receipt.currency),
        currency: receipt.currency,
        billingInterval: intervalLabel,
        paymentDate,
        paymentId: receipt.providerPaymentId,
        subscriptionId,
        status: status === "active" ? "Active" : status,
        nextBillingDate: nextLabel,
        invoiceUrl: invoiceUrlFor(invoices, receipt.providerPaymentId),
        billingUrl: `${emailConfig.appUrl}/dashboard/billing`,
        recurring,
      }),
    });

    if (!result.success) {
      console.error("[subscription notice] email failed", {
        organizationId,
        paymentId: receipt.providerPaymentId,
        error: result.error,
      });
      throw new Error(result.error || "Subscription confirmation email failed.");
    }

    await db
      .update(billingReceipts)
      .set({ confirmationSentAt: new Date() })
      .where(eq(billingReceipts.id, receipt.id));
  }
}

function isPaidPlanId(planId: string): planId is "starter" | "professional" {
  return planId === "starter" || planId === "professional";
}
