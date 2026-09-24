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
import {
  fetchRazorpaySubscription,
  getPlanIdFromRazorpayPlanId,
  getRazorpayPlanId,
  mapRazorpayPeriodDate,
} from "@/lib/payments/razorpay-subscriptions";

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

function mapLocalStatus(
  providerStatus: string,
  currentEnd?: Date,
  endedAt?: Date
): "active" | "past_due" | "canceled" | "incomplete" {
  if (providerStatus === "active" || providerStatus === "authenticated") {
    return "active";
  }
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

export async function abandonSubscriptionCheckoutAttempt({
  organizationId,
  subscriptionId,
}: {
  organizationId: string;
  subscriptionId: string;
}): Promise<boolean> {
  return db.transaction(async (tx) => {
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

    if (!attempt) return true;
    if (attempt.providerSubscriptionId !== subscriptionId) return false;
    if (TERMINAL_CHECKOUT_ATTEMPT_STATUSES.has(attempt.status.toLowerCase())) {
      return true;
    }
    if (attempt.status !== "creating" && attempt.status !== "pending") {
      return true;
    }

    const updated = await tx
      .update(subscriptionCheckoutAttempts)
      .set({ status: "abandoned", updatedAt: new Date() })
      .where(eq(subscriptionCheckoutAttempts.id, attempt.id))
      .returning({ id: subscriptionCheckoutAttempts.id });

    return updated.length > 0;
  });
}

export async function failSubscriptionCheckoutAttempt({
  organizationId,
  subscriptionId,
}: {
  organizationId: string;
  subscriptionId: string;
}): Promise<boolean> {
  return db.transaction(async (tx) => {
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

    if (!attempt) return true;
    if (attempt.providerSubscriptionId !== subscriptionId) return false;
    if (TERMINAL_CHECKOUT_ATTEMPT_STATUSES.has(attempt.status.toLowerCase())) {
      return true;
    }
    if (attempt.status !== "creating" && attempt.status !== "pending") {
      return true;
    }

    const updated = await tx
      .update(subscriptionCheckoutAttempts)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(subscriptionCheckoutAttempts.id, attempt.id))
      .returning({ id: subscriptionCheckoutAttempts.id });

    return updated.length > 0;
  });
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

async function activateCheckoutAttempt({
  attempt,
  subscription,
}: {
  attempt: typeof subscriptionCheckoutAttempts.$inferSelect;
  subscription: RazorpaySubscriptionResponse;
}) {
  await db
    .update(subscriptions)
    .set({
      planId: attempt.planId,
      status: "active",
      provider: "razorpay",
      providerStatus: subscription.status,
      razorpaySubscriptionId: subscription.id,
      razorpayPlanId: subscription.plan_id,
      razorpayCustomerId: subscription.customer_id ?? null,
      currentPeriodStart: mapRazorpayPeriodDate(subscription.current_start),
      currentPeriodEnd: mapRazorpayPeriodDate(subscription.current_end),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.organizationId, attempt.organizationId));
  await db
    .delete(subscriptionCheckoutAttempts)
    .where(eq(subscriptionCheckoutAttempts.id, attempt.id));
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

export async function markRazorpayCheckoutAuthorized({
  organizationId,
  subscriptionId,
}: {
  organizationId: string;
  subscriptionId: string;
}) {
  const current = await getOrganizationSubscription(organizationId);
  if (
    current?.razorpaySubscriptionId === subscriptionId &&
    current.status === "active"
  ) {
    return;
  }

  const attempt = await getCheckoutAttemptForSubscription(subscriptionId);
  if (!attempt || attempt.organizationId !== organizationId) {
    throw new Error("Subscription checkout attempt not found.");
  }
  if (!isPaidPlan(attempt.planId)) {
    throw new Error("Subscription checkout attempt not found.");
  }

  let subscription: RazorpaySubscriptionResponse = {
    id: subscriptionId,
    plan_id: getRazorpayPlanId(attempt.planId),
    status: "authenticated",
    customer_id: current?.razorpayCustomerId ?? null,
  };
  try {
    const fetched = await fetchRazorpaySubscription(subscriptionId);
    subscription = {
      ...fetched,
      plan_id: fetched.plan_id || getRazorpayPlanId(attempt.planId),
    };
  } catch (error) {
    console.error("[razorpay checkout authorize] subscription fetch failed", {
      organizationId,
      error: error instanceof Error ? error.message : "unknown",
    });
  }

  await activateCheckoutAttempt({
    attempt,
    subscription,
  });
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
    const isSuccessful =
      providerStatus === "authenticated" || providerStatus === "active";
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
          : "pending",
        updatedAt: new Date(),
      })
      .where(eq(subscriptionCheckoutAttempts.id, attempt.id));
    if (isSuccessful) {
      await activateCheckoutAttempt({ attempt, subscription });
    }
    return true;
  }

  const currentStart = mapRazorpayPeriodDate(subscription.current_start);
  const currentEnd = mapRazorpayPeriodDate(subscription.current_end);
  const endedAt = mapRazorpayPeriodDate(subscription.ended_at);
  const notesPlan = subscription.notes?.planId;
  const planId =
    getPlanIdFromRazorpayPlanId(subscription.plan_id) ??
    (isPaidPlan(notesPlan ?? "")
      ? (notesPlan as Extract<PlanId, "starter" | "professional">)
      : row.planId);
  const localStatus = mapLocalStatus(subscription.status, currentEnd, endedAt);
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
      provider: "razorpay",
      providerStatus: subscription.status,
      razorpayPlanId: subscription.plan_id,
      razorpayCustomerId: subscription.customer_id ?? row.razorpayCustomerId,
      currentPeriodStart: currentStart ?? row.currentPeriodStart,
      currentPeriodEnd: currentEnd ?? row.currentPeriodEnd,
      cancelAtPeriodEnd: scheduledCancellation,
      canceledAt: endedAt,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.razorpaySubscriptionId, subscription.id));

  return eventType.length > 0;
}

export async function claimRazorpayWebhookEvent({
  eventId,
  eventType,
  subscriptionId,
}: {
  eventId: string;
  eventType: string;
  subscriptionId?: string;
}): Promise<boolean> {
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

  return inserted.length > 0;
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
