import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  subscriptionCheckoutAttempts,
  subscriptions,
  subscriptionWebhookEvents,
} from "@/db/schema";
import { sql } from "drizzle-orm";
import type { PlanId } from "@/types/subscription";
import type { RazorpaySubscriptionResponse } from "@/lib/payments/razorpay-subscriptions";
import { webhookDeliveryAction } from "@/lib/security/webhook-delivery";
import {
  cancelRazorpaySubscription,
  fetchRazorpayPlan,
  fetchRazorpaySubscription,
  fetchRazorpaySubscriptionInvoices,
  getPlanIdFromRazorpayPlanId,
  getRazorpayPlanId,
  mapRazorpayPeriodDate,
  type RazorpayInvoiceResponse,
} from "@/lib/payments/razorpay-subscriptions";
import {
  billingIntervalFromPeriod,
  chargeConfirmsPaidAccess,
  periodEndFromPlan,
} from "@/lib/subscription/billing-eligibility";
import { recordPaidRazorpayInvoices } from "@/lib/subscription/billing-receipts";
import { notifySubscriptionPayments } from "@/lib/subscription/subscription-payment-notice";
import { hasActivePaidEntitlement } from "@/lib/subscription/trial";

const AWAITING_CHARGE_STATUSES = new Set(["created", "authenticated", "pending"]);

const PAID_PLAN_IDS = new Set<PlanId>(["starter", "professional"]);
const TERMINAL_PROVIDER_STATUSES = new Set([
  "cancelled",
  "completed",
  "expired",
  "failed",
  "abandoned",
]);
const TERMINAL_CHECKOUT_ATTEMPT_STATUSES = new Set([
  "failed",
  "cancelled",
  "expired",
  "abandoned",
]);
const CHECKOUT_ATTEMPT_STALE_MS = 30 * 60 * 1000;

function isPaidPlan(value: string): value is Extract<PlanId, "starter" | "professional"> {
  return PAID_PLAN_IDS.has(value as PlanId);
}

function paidPeriodEnd(subscription: RazorpaySubscriptionResponse): Date | null {
  const end = mapRazorpayPeriodDate(subscription.current_end);
  if (!end || end.getTime() <= Date.now()) return null;
  return end;
}

/** Paid access requires Razorpay status active and a period end still in the future. */
export function isBillableRazorpaySubscription(
  subscription: RazorpaySubscriptionResponse
): boolean {
  return subscription.status.toLowerCase() === "active" && paidPeriodEnd(subscription) !== null;
}

function mapLocalStatus(
  providerStatus: string,
  currentEnd?: Date,
  endedAt?: Date
): "active" | "past_due" | "canceled" | "incomplete" {
  if (providerStatus === "active") {
    if (!currentEnd || currentEnd.getTime() <= Date.now()) return "incomplete";
    return "active";
  }
  if (providerStatus === "authenticated") return "incomplete";
  if (providerStatus === "pending" || providerStatus === "halted" || providerStatus === "paused") {
    return "past_due";
  }
  if (
    TERMINAL_PROVIDER_STATUSES.has(providerStatus) &&
    currentEnd &&
    currentEnd.getTime() > Date.now() &&
    !endedAt
  ) {
    return "active";
  }
  if (TERMINAL_PROVIDER_STATUSES.has(providerStatus)) return "canceled";
  return "incomplete";
}

export async function getOrganizationSubscription(organizationId: string) {
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, organizationId))
    .limit(1);
  return row ?? null;
}

export async function getSubscriptionForRazorpayId(subscriptionId: string) {
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.razorpaySubscriptionId, subscriptionId))
    .limit(1);
  return row ?? null;
}

export async function claimSubscriptionCheckoutAttempt({
  organizationId,
  requestId,
  planId,
}: {
  organizationId: string;
  requestId: string;
  planId: Extract<PlanId, "starter" | "professional">;
}) {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${organizationId}))`
    );

    const [existing] = await tx
      .select()
      .from(subscriptionCheckoutAttempts)
      .where(eq(subscriptionCheckoutAttempts.organizationId, organizationId))
      .limit(1);

    const providerStatus = existing?.providerStatus?.toLowerCase() ?? "";
    const isStale =
      existing != null &&
      Date.now() - existing.updatedAt.getTime() >= CHECKOUT_ATTEMPT_STALE_MS;
    const isOpen =
      existing != null &&
      !TERMINAL_CHECKOUT_ATTEMPT_STATUSES.has(existing.status.toLowerCase()) &&
      !TERMINAL_PROVIDER_STATUSES.has(providerStatus) &&
      !isStale;

    if (existing?.status === "scheduled" && existing.planId === planId) {
      return { kind: "scheduled" as const, attempt: existing };
    }

    if (isOpen) {
      if (
        existing.requestId === requestId &&
        existing.providerSubscriptionId &&
        existing.status === "pending"
      ) {
        return { kind: "reuse" as const, attempt: existing };
      }
      return { kind: "conflict" as const, attempt: existing };
    }

    if (existing) {
      const [updated] = await tx
        .update(subscriptionCheckoutAttempts)
        .set({
          requestId,
          planId,
          status: "creating",
          providerSubscriptionId: null,
          providerStatus: null,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionCheckoutAttempts.id, existing.id))
        .returning();
      return { kind: "claimed" as const, attempt: updated };
    }

    const [created] = await tx
      .insert(subscriptionCheckoutAttempts)
      .values({ organizationId, requestId, planId, status: "creating" })
      .returning();
    return { kind: "claimed" as const, attempt: created };
  });
}

export async function markSubscriptionCheckoutCreated({
  attemptId,
  subscription,
}: {
  attemptId: string;
  subscription: RazorpaySubscriptionResponse;
}) {
  const [attempt] = await db
    .update(subscriptionCheckoutAttempts)
    .set({
      status: TERMINAL_PROVIDER_STATUSES.has(subscription.status.toLowerCase())
        ? "failed"
        : "pending",
      providerSubscriptionId: subscription.id,
      providerStatus: subscription.status,
      updatedAt: new Date(),
    })
    .where(eq(subscriptionCheckoutAttempts.id, attemptId))
    .returning();
  return attempt ?? null;
}

export async function markSubscriptionCheckoutFailed(attemptId: string) {
  await db
    .update(subscriptionCheckoutAttempts)
    .set({ status: "failed", updatedAt: new Date() })
    .where(eq(subscriptionCheckoutAttempts.id, attemptId));
}

async function cancelCheckoutSubscriptionIfUnlinked(
  organizationId: string,
  subscriptionId: string
) {
  const current = await getOrganizationSubscription(organizationId);
  if (current?.razorpaySubscriptionId === subscriptionId) return;
  try {
    await cancelRazorpaySubscription(subscriptionId, { atCycleEnd: false });
  } catch (error) {
    console.error("[razorpay checkout] unused subscription cancel failed", {
      organizationId,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}

export async function abandonSubscriptionCheckoutAttempt({
  organizationId,
  subscriptionId,
}: {
  organizationId: string;
  subscriptionId: string;
}): Promise<boolean> {
  const outcome = await db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${organizationId}))`
    );

    const [attempt] = await tx
      .select({
        id: subscriptionCheckoutAttempts.id,
        providerSubscriptionId: subscriptionCheckoutAttempts.providerSubscriptionId,
        status: subscriptionCheckoutAttempts.status,
      })
      .from(subscriptionCheckoutAttempts)
      .where(eq(subscriptionCheckoutAttempts.organizationId, organizationId))
      .limit(1);

    if (!attempt) return "done" as const;
    if (attempt.providerSubscriptionId !== subscriptionId) return "ignored" as const;
    if (TERMINAL_CHECKOUT_ATTEMPT_STATUSES.has(attempt.status.toLowerCase())) {
      return "done" as const;
    }
    if (attempt.status !== "creating" && attempt.status !== "pending") {
      return "done" as const;
    }

    const updated = await tx
      .update(subscriptionCheckoutAttempts)
      .set({ status: "abandoned", updatedAt: new Date() })
      .where(eq(subscriptionCheckoutAttempts.id, attempt.id))
      .returning({ id: subscriptionCheckoutAttempts.id });

    return updated.length > 0 ? ("cancel" as const) : ("done" as const);
  });
  if (outcome === "cancel") {
    await cancelCheckoutSubscriptionIfUnlinked(organizationId, subscriptionId);
  }
  return outcome !== "ignored";
}

export async function failSubscriptionCheckoutAttempt({
  organizationId,
  subscriptionId,
}: {
  organizationId: string;
  subscriptionId: string;
}): Promise<boolean> {
  const outcome = await db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${organizationId}))`
    );

    const [attempt] = await tx
      .select({
        id: subscriptionCheckoutAttempts.id,
        providerSubscriptionId: subscriptionCheckoutAttempts.providerSubscriptionId,
        status: subscriptionCheckoutAttempts.status,
      })
      .from(subscriptionCheckoutAttempts)
      .where(eq(subscriptionCheckoutAttempts.organizationId, organizationId))
      .limit(1);

    if (!attempt) return "done" as const;
    if (attempt.providerSubscriptionId !== subscriptionId) return "ignored" as const;
    if (TERMINAL_CHECKOUT_ATTEMPT_STATUSES.has(attempt.status.toLowerCase())) {
      return "done" as const;
    }
    if (attempt.status !== "creating" && attempt.status !== "pending") {
      return "done" as const;
    }

    const updated = await tx
      .update(subscriptionCheckoutAttempts)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(subscriptionCheckoutAttempts.id, attempt.id))
      .returning({ id: subscriptionCheckoutAttempts.id });

    return updated.length > 0 ? ("cancel" as const) : ("done" as const);
  });
  if (outcome === "cancel") {
    await cancelCheckoutSubscriptionIfUnlinked(organizationId, subscriptionId);
  }
  return outcome !== "ignored";
}

export async function failSubscriptionCheckoutByProviderId(
  subscriptionId: string
): Promise<boolean> {
  const attempt = await getCheckoutAttemptForSubscription(subscriptionId);
  if (!attempt) return false;
  return failSubscriptionCheckoutAttempt({
    organizationId: attempt.organizationId,
    subscriptionId,
  });
}

async function getCheckoutAttemptForSubscription(subscriptionId: string) {
  const [row] = await db
    .select()
    .from(subscriptionCheckoutAttempts)
    .where(eq(subscriptionCheckoutAttempts.providerSubscriptionId, subscriptionId))
    .limit(1);
  return row ?? null;
}

async function getCreatingCheckoutAttemptForOrganization(organizationId: string) {
  const [row] = await db
    .select()
    .from(subscriptionCheckoutAttempts)
    .where(
      and(
        eq(subscriptionCheckoutAttempts.organizationId, organizationId),
        eq(subscriptionCheckoutAttempts.status, "creating")
      )
    )
    .limit(1);
  return row ?? null;
}

async function billingIntervalForPlan(planId: string) {
  try {
    const plan = await fetchRazorpayPlan(planId);
    return billingIntervalFromPeriod(plan.period);
  } catch {
    return "monthly" as const;
  }
}

async function confirmedSubscription(subscription: RazorpaySubscriptionResponse): Promise<{
  subscription: RazorpaySubscriptionResponse;
  hasPaidCharge: boolean;
  invoices: RazorpayInvoiceResponse[];
}> {
  let invoices: RazorpayInvoiceResponse[] = [];
  try {
    invoices = await fetchRazorpaySubscriptionInvoices(subscription.id);
  } catch (error) {
    console.error("[razorpay invoices]", error instanceof Error ? error.message : "unknown");
  }
  const paidInvoices = invoices.filter(
    (invoice) => invoice.status?.toLowerCase() === "paid" && Boolean(invoice.payment_id)
  );
  const hasPaidCharge = paidInvoices.length > 0;
  if (isBillableRazorpaySubscription(subscription) || !hasPaidCharge) {
    return { subscription, hasPaidCharge, invoices: paidInvoices };
  }
  const paidAt =
    mapRazorpayPeriodDate(paidInvoices[0]?.paid_at) ?? new Date();
  const start = mapRazorpayPeriodDate(subscription.current_start) ?? paidAt;
  let end = mapRazorpayPeriodDate(subscription.current_end);
  if (!end) {
    const plan = await fetchRazorpayPlan(subscription.plan_id);
    end = periodEndFromPlan(start, plan.period, plan.interval);
  }
  return {
    hasPaidCharge,
    invoices: paidInvoices,
    subscription: {
      ...subscription,
      current_start: Math.floor(start.getTime() / 1000),
      current_end: Math.floor(end.getTime() / 1000),
    },
  };
}

function grantsPaidAccess(
  subscription: RazorpaySubscriptionResponse,
  hasPaidCharge: boolean
): boolean {
  return chargeConfirmsPaidAccess({
    status: subscription.status,
    currentEnd: mapRazorpayPeriodDate(subscription.current_end) ?? null,
    hasPaidCharge: hasPaidCharge || isBillableRazorpaySubscription(subscription),
  });
}

async function activateCheckoutAttempt({
  attempt,
  subscription,
  hasPaidCharge,
  invoices,
}: {
  attempt: typeof subscriptionCheckoutAttempts.$inferSelect;
  subscription: RazorpaySubscriptionResponse;
  hasPaidCharge: boolean;
  invoices: RazorpayInvoiceResponse[];
}) {
  if (!grantsPaidAccess(subscription, hasPaidCharge)) {
    throw new Error("Subscription is not in a paid state.");
  }
  const interval = await billingIntervalForPlan(subscription.plan_id);
  await db
    .update(subscriptions)
    .set({
      planId: attempt.planId,
      status: "active",
      billingInterval: interval,
      provider: "razorpay",
      providerStatus: subscription.status,
      razorpaySubscriptionId: subscription.id,
      razorpayPlanId: subscription.plan_id,
      razorpayCustomerId: subscription.customer_id || undefined,
      currentPeriodStart: mapRazorpayPeriodDate(subscription.current_start),
      currentPeriodEnd: mapRazorpayPeriodDate(subscription.current_end),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.organizationId, attempt.organizationId));
  await db
    .delete(subscriptionCheckoutAttempts)
    .where(eq(subscriptionCheckoutAttempts.id, attempt.id));
  await recordPaidRazorpayInvoices({
    organizationId: attempt.organizationId,
    planId: attempt.planId,
    subscriptionId: subscription.id,
    invoices,
    periodStart: mapRazorpayPeriodDate(subscription.current_start),
    periodEnd: mapRazorpayPeriodDate(subscription.current_end),
  });
  await notifySubscriptionPayments({
    organizationId: attempt.organizationId,
    invoices,
    planId: attempt.planId,
    billingInterval: interval,
    subscriptionId: subscription.id,
    status: "active",
    nextBillingDate: mapRazorpayPeriodDate(subscription.current_end),
    initialActivation: true,
  });
}

export function hasOpenRazorpaySubscription(
  row: Awaited<ReturnType<typeof getOrganizationSubscription>>
): boolean {
  if (!row?.razorpaySubscriptionId) return false;
  if (row.status !== "active") return false;
  if (row.currentPeriodEnd && row.currentPeriodEnd.getTime() <= Date.now()) {
    return false;
  }
  return true;
}

export async function persistRazorpayCustomerId({
  organizationId,
  customerId,
}: {
  organizationId: string;
  customerId: string;
}) {
  const trimmed = customerId.trim();
  if (!trimmed) return;
  await db
    .update(subscriptions)
    .set({
      provider: "razorpay",
      razorpayCustomerId: trimmed,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.organizationId, organizationId));
}

function assertCheckoutPlan(
  subscription: RazorpaySubscriptionResponse,
  planId: Extract<PlanId, "starter" | "professional">
) {
  if (getPlanIdFromRazorpayPlanId(subscription.plan_id) !== planId) {
    throw new Error("Subscription plan does not match the checkout.");
  }
}

async function fetchUntilSettled(
  subscriptionId: string,
  planId: Extract<PlanId, "starter" | "professional">
): Promise<RazorpaySubscriptionResponse> {
  let last: RazorpaySubscriptionResponse | null = null;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const fetched = await fetchRazorpaySubscription(subscriptionId);
    last = {
      ...fetched,
      plan_id: fetched.plan_id || getRazorpayPlanId(planId),
    };
    const confirmed = await confirmedSubscription(last);
    if (grantsPaidAccess(confirmed.subscription, confirmed.hasPaidCharge)) {
      return confirmed.subscription;
    }
    if (TERMINAL_PROVIDER_STATUSES.has(last.status.toLowerCase())) return last;
    if (attempt < 5) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  if (!last) throw new Error("Unable to confirm the subscription with Razorpay.");
  return last;
}

export async function markRazorpayCheckoutAuthorized({
  organizationId,
  subscriptionId,
}: {
  organizationId: string;
  subscriptionId: string;
}): Promise<"active" | "scheduled"> {
  const current = await getOrganizationSubscription(organizationId);
  if (
    current?.razorpaySubscriptionId === subscriptionId &&
    current.status === "active"
  ) {
    return "active";
  }

  const attempt = await getCheckoutAttemptForSubscription(subscriptionId);
  if (!attempt || attempt.organizationId !== organizationId) {
    throw new Error("Subscription checkout attempt not found.");
  }
  if (!isPaidPlan(attempt.planId)) {
    throw new Error("Subscription checkout attempt not found.");
  }

  let subscription: RazorpaySubscriptionResponse;
  try {
    subscription = await fetchUntilSettled(subscriptionId, attempt.planId);
  } catch (error) {
    console.error("[razorpay checkout authorize] subscription fetch failed", {
      organizationId,
      error: error instanceof Error ? error.message : "unknown",
    });
    throw new Error("Unable to confirm the subscription with Razorpay.");
  }

  assertCheckoutPlan(subscription, attempt.planId);
  const startsAt = mapRazorpayPeriodDate(subscription.start_at);
  if (startsAt && startsAt.getTime() > Date.now()) {
    await db
      .update(subscriptionCheckoutAttempts)
      .set({
        status: "scheduled",
        providerSubscriptionId: subscription.id,
        providerStatus: subscription.status,
        updatedAt: new Date(),
      })
      .where(eq(subscriptionCheckoutAttempts.id, attempt.id));
    if (
      current?.razorpaySubscriptionId &&
      current.razorpaySubscriptionId !== subscription.id
    ) {
      const ended = await cancelRazorpaySubscription(current.razorpaySubscriptionId, {
        atCycleEnd: true,
      });
      await applyRazorpaySubscriptionEvent(ended, "subscription.cancelled", {
        cancelAtPeriodEnd: true,
      });
    }
    return "scheduled";
  }
  const confirmed = await confirmedSubscription(subscription);

  if (!grantsPaidAccess(confirmed.subscription, confirmed.hasPaidCharge)) {
    const providerStatus = confirmed.subscription.status.toLowerCase();
    if (AWAITING_CHARGE_STATUSES.has(providerStatus)) {
      throw new Error("Subscription payment is processing.");
    }
    throw new Error("Subscription is not in a paid state.");
  }

  await activateCheckoutAttempt({
    attempt,
    subscription: confirmed.subscription,
    hasPaidCharge: confirmed.hasPaidCharge,
    invoices: confirmed.invoices,
  });
  return "active";
}

export async function applyRazorpaySubscriptionEvent(
  subscription: RazorpaySubscriptionResponse,
  eventType: string,
  options?: { cancelAtPeriodEnd?: boolean }
): Promise<boolean> {
  const row = await getSubscriptionForRazorpayId(subscription.id);
  if (!row) {
    const attempt =
      (await getCheckoutAttemptForSubscription(subscription.id)) ??
      (subscription.notes?.organizationId
        ? await getCreatingCheckoutAttemptForOrganization(
            subscription.notes.organizationId
          )
        : null);
    if (!attempt) return false;
    const providerStatus = subscription.status.toLowerCase();
    const startsAt = mapRazorpayPeriodDate(subscription.start_at);
    const stillDeferred = Boolean(startsAt && startsAt.getTime() > Date.now());
    const confirmed = await confirmedSubscription(subscription);
    const isSuccessful =
      !stillDeferred &&
      grantsPaidAccess(confirmed.subscription, confirmed.hasPaidCharge);
    if (
      TERMINAL_CHECKOUT_ATTEMPT_STATUSES.has(attempt.status.toLowerCase()) &&
      !isSuccessful
    ) {
      return true;
    }
    await db
      .update(subscriptionCheckoutAttempts)
      .set({
        providerSubscriptionId: subscription.id,
        providerStatus: subscription.status,
        status: TERMINAL_PROVIDER_STATUSES.has(providerStatus)
          ? "failed"
          : attempt.status === "scheduled"
            ? "scheduled"
            : "pending",
        updatedAt: new Date(),
      })
      .where(eq(subscriptionCheckoutAttempts.id, attempt.id));
    if (isSuccessful) {
      if (!isPaidPlan(attempt.planId)) return false;
      assertCheckoutPlan(confirmed.subscription, attempt.planId);
      await activateCheckoutAttempt({
        attempt,
        subscription: confirmed.subscription,
        hasPaidCharge: confirmed.hasPaidCharge,
        invoices: confirmed.invoices,
      });
    }
    return true;
  }

  const confirmed = await confirmedSubscription(subscription);
  const effective = confirmed.subscription;
  const currentStart = mapRazorpayPeriodDate(effective.current_start);
  const currentEnd = mapRazorpayPeriodDate(effective.current_end);
  const endedAt = mapRazorpayPeriodDate(effective.ended_at);
  const notesPlan = effective.notes?.planId;
  const planId =
    getPlanIdFromRazorpayPlanId(effective.plan_id) ??
    (isPaidPlan(notesPlan ?? "")
      ? (notesPlan as Extract<PlanId, "starter" | "professional">)
      : row.planId);
  let localStatus = mapLocalStatus(
    effective.status.toLowerCase(),
    currentEnd,
    endedAt
  );
  if (grantsPaidAccess(effective, confirmed.hasPaidCharge)) {
    localStatus = "active";
  }
  const alreadyPaid = hasActivePaidEntitlement({
    planId: row.planId,
    status: row.status,
    trialStart: row.trialStart?.getTime(),
    trialEnd: row.trialEnd?.getTime(),
    currentPeriodEnd: row.currentPeriodEnd?.getTime(),
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
  });
  if (
    alreadyPaid &&
    localStatus === "incomplete" &&
    !TERMINAL_PROVIDER_STATUSES.has(effective.status.toLowerCase())
  ) {
    localStatus = "active";
  }
  if (
    row.providerStatus &&
    TERMINAL_PROVIDER_STATUSES.has(row.providerStatus.toLowerCase()) &&
    eventType !== "subscription.resumed" &&
    localStatus === "active" &&
    row.currentPeriodEnd &&
    currentEnd &&
    currentEnd.getTime() <= row.currentPeriodEnd.getTime()
  ) {
    return true;
  }
  const scheduledCancellation =
    options?.cancelAtPeriodEnd ??
    (eventType === "subscription.resumed"
      ? false
      : eventType === "subscription.cancelled"
        ? Boolean(currentEnd && currentEnd.getTime() > Date.now() && !endedAt)
        : Boolean(subscription.change_scheduled_at));

  await db
    .update(subscriptions)
    .set({
      planId,
      status: localStatus,
      billingInterval: await billingIntervalForPlan(effective.plan_id),
      provider: "razorpay",
      providerStatus: effective.status,
      razorpayPlanId: effective.plan_id,
      razorpayCustomerId: effective.customer_id ?? row.razorpayCustomerId,
      currentPeriodStart: currentStart ?? row.currentPeriodStart,
      currentPeriodEnd: currentEnd ?? row.currentPeriodEnd,
      cancelAtPeriodEnd: scheduledCancellation,
      canceledAt: endedAt,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.razorpaySubscriptionId, subscription.id));

  if (isPaidPlan(planId)) {
    await recordPaidRazorpayInvoices({
      organizationId: row.organizationId,
      planId,
      subscriptionId: effective.id,
      invoices: confirmed.invoices,
      periodStart: currentStart ?? row.currentPeriodStart ?? undefined,
      periodEnd: currentEnd ?? row.currentPeriodEnd ?? undefined,
    });
    if (localStatus === "active") {
      await notifySubscriptionPayments({
        organizationId: row.organizationId,
        invoices: confirmed.invoices,
        planId,
        billingInterval: await billingIntervalForPlan(effective.plan_id),
        subscriptionId: effective.id,
        status: localStatus,
        nextBillingDate: currentEnd ?? row.currentPeriodEnd,
        initialActivation: !alreadyPaid,
      });
    }
  }

  return eventType.length > 0;
}

export async function syncOrganizationReceipts(
  organizationId: string,
  existing?: Awaited<ReturnType<typeof getOrganizationSubscription>>
) {
  const row = existing ?? (await getOrganizationSubscription(organizationId));
  if (!row?.razorpaySubscriptionId) return;
  try {
    const invoices = await fetchRazorpaySubscriptionInvoices(row.razorpaySubscriptionId);
    await recordPaidRazorpayInvoices({
      organizationId,
      planId: isPaidPlan(row.planId) ? row.planId : null,
      subscriptionId: row.razorpaySubscriptionId,
      invoices,
      periodStart: row.currentPeriodStart ?? undefined,
      periodEnd: row.currentPeriodEnd ?? undefined,
    });
  } catch (error) {
    console.error("[billing receipt sync]", {
      organizationId,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}

export async function reconcileOrganizationBilling(organizationId: string) {
  const row = await getOrganizationSubscription(organizationId);
  const [attempt] = await db
    .select()
    .from(subscriptionCheckoutAttempts)
    .where(eq(subscriptionCheckoutAttempts.organizationId, organizationId))
    .limit(1);
  const alreadyPaid =
    row != null &&
    hasActivePaidEntitlement({
      planId: row.planId,
      status: row.status,
      trialStart: row.trialStart?.getTime(),
      trialEnd: row.trialEnd?.getTime(),
      currentPeriodEnd: row.currentPeriodEnd?.getTime(),
      cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    });
  if (alreadyPaid) {
    await syncOrganizationReceipts(organizationId, row);
    return;
  }
  const subscriptionId =
    row?.razorpaySubscriptionId || attempt?.providerSubscriptionId || "";
  if (!subscriptionId) return;
  try {
    const subscription = await fetchRazorpaySubscription(subscriptionId);
    await applyRazorpaySubscriptionEvent(subscription, "subscription.charged");
  } catch (error) {
    console.error("[razorpay reconcile]", {
      organizationId,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}

export async function claimRazorpayWebhookEvent({
  eventId,
  eventType,
  subscriptionId,
}: {
  eventId: string;
  eventType: string;
  subscriptionId?: string;
}): Promise<"process" | "already_processed"> {
  const inserted = await db
    .insert(subscriptionWebhookEvents)
    .values({
      provider: "razorpay",
      eventId,
      eventType,
      subscriptionId,
    })
    .onConflictDoNothing({
      target: [
        subscriptionWebhookEvents.provider,
        subscriptionWebhookEvents.eventId,
      ],
    })
    .returning({ id: subscriptionWebhookEvents.id });

  if (inserted.length > 0) return webhookDeliveryAction(true, null);

  const [existing] = await db
    .select({ processedAt: subscriptionWebhookEvents.processedAt })
    .from(subscriptionWebhookEvents)
    .where(
      and(
        eq(subscriptionWebhookEvents.provider, "razorpay"),
        eq(subscriptionWebhookEvents.eventId, eventId)
      )
    )
    .limit(1);

  return webhookDeliveryAction(false, existing?.processedAt ?? null);
}

export async function markRazorpayWebhookEventProcessed(eventId: string) {
  await db
    .update(subscriptionWebhookEvents)
    .set({ processedAt: new Date() })
    .where(
      and(
        eq(subscriptionWebhookEvents.provider, "razorpay"),
        eq(subscriptionWebhookEvents.eventId, eventId)
      )
    );
}
