import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { billingReceipts, organizations } from "@/db/schema";
import type { RazorpayInvoiceResponse } from "@/lib/payments/razorpay-subscriptions";
import {
  fetchRazorpayPayment,
  mapRazorpayPeriodDate,
} from "@/lib/payments/razorpay-subscriptions";
import type { BillingReceiptRecord } from "@/types/billing-receipt";
import type { PlanId } from "@/types/subscription";

import { receiptNumberForPayment } from "./billing-eligibility";

function iso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

export type { BillingReceiptRecord };

export function toBillingReceiptRecord(
  row: typeof billingReceipts.$inferSelect
): BillingReceiptRecord {
  return {
    id: row.id,
    organizationId: row.organizationId,
    receiptNumber: row.receiptNumber,
    description: row.description,
    amountMinor: row.amountMinor,
    currency: row.currency,
    status: row.status,
    paidAt: iso(row.paidAt),
    planId: row.planId,
    periodStart: iso(row.periodStart),
    periodEnd: iso(row.periodEnd),
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    paymentMethodSummary: row.paymentMethodSummary,
    providerPaymentId: row.providerPaymentId,
    providerInvoiceId: row.providerInvoiceId,
    providerSubscriptionId: row.providerSubscriptionId,
    documentStatus: row.documentStatus,
  };
}

async function paymentMethodSummary(paymentId: string): Promise<string | null> {
  try {
    const payment = await fetchRazorpayPayment(paymentId);
    return payment.methodSummary;
  } catch {
    return null;
  }
}

export async function recordPaidRazorpayInvoices({
  organizationId,
  planId,
  subscriptionId,
  invoices,
  periodStart,
  periodEnd,
}: {
  organizationId: string;
  planId?: PlanId | null;
  subscriptionId: string;
  invoices: RazorpayInvoiceResponse[];
  periodStart?: Date;
  periodEnd?: Date;
}): Promise<void> {
  const [organization] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);

  for (const invoice of invoices) {
    if (invoice.status?.toLowerCase() !== "paid") continue;
    const paymentId = invoice.payment_id?.trim();
    if (!paymentId) continue;
    if (typeof invoice.amount !== "number" || !invoice.currency) continue;
    const paidAt = mapRazorpayPeriodDate(invoice.paid_at) ?? new Date();
    const method = await paymentMethodSummary(paymentId);
    try {
      await db
        .insert(billingReceipts)
        .values({
          organizationId,
          provider: "razorpay",
          providerPaymentId: paymentId,
          providerInvoiceId: invoice.id,
          providerSubscriptionId: invoice.subscription_id || subscriptionId,
          receiptNumber: receiptNumberForPayment(paymentId, paidAt),
          description:
            invoice.description?.trim() ||
            "FaithConnectHub subscription payment",
          amountMinor: invoice.amount,
          currency: invoice.currency.toUpperCase(),
          status: "paid",
          paidAt,
          planId: planId ?? undefined,
          periodStart,
          periodEnd,
          customerName:
            invoice.customer_details?.name?.trim() || organization?.name || null,
          customerEmail: invoice.customer_details?.email?.trim() || null,
          paymentMethodSummary: method,
          documentStatus: "ready",
        })
        .onConflictDoNothing({
          target: [billingReceipts.provider, billingReceipts.providerPaymentId],
        });
    } catch (error) {
      console.error("[billing receipt] insert failed", {
        organizationId,
        paymentId,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }
}

export async function listBillingReceipts(
  organizationId: string
): Promise<BillingReceiptRecord[]> {
  const rows = await db
    .select()
    .from(billingReceipts)
    .where(eq(billingReceipts.organizationId, organizationId))
    .orderBy(desc(billingReceipts.paidAt));
  return rows.map(toBillingReceiptRecord);
}

export async function getBillingReceiptForOrganization(
  organizationId: string,
  receiptId: string
) {
  const [row] = await db
    .select()
    .from(billingReceipts)
    .where(
      and(
        eq(billingReceipts.id, receiptId),
        eq(billingReceipts.organizationId, organizationId)
      )
    )
    .limit(1);
  return row ?? null;
}
