import type { PlanId } from "@/types/subscription";

export const TERMINAL_PROVIDER_STATUSES = new Set([
  "cancelled",
  "completed",
  "expired",
  "failed",
  "abandoned",
]);

export const TERMINAL_CHECKOUT_ATTEMPT_STATUSES = new Set([
  "failed",
  "cancelled",
  "expired",
  "abandoned",
]);

/** Only `created` can be reopened in Razorpay Standard Checkout. */
export const CHECKOUT_REUSABLE_PROVIDER_STATUS = "created";

/** In-flight `creating` rows without a provider id. After this, a refresh may reclaim. */
export const CREATING_IN_FLIGHT_MS = 90_000;

export type CheckoutAttemptSnapshot = {
  requestId: string;
  planId: string;
  status: string;
  providerSubscriptionId: string | null;
  providerStatus: string | null;
  updatedAt: Date;
};

export type ProviderLookup =
  | { kind: "none" }
  | { kind: "unreachable" }
  | { kind: "found"; status: string };

export type CheckoutClaimDecision =
  | { action: "insert" }
  | { action: "scheduled" }
  | { action: "reuse" }
  | { action: "already_active" }
  | { action: "replace"; cancelProviderId?: string }
  | { action: "conflict" };

/** Peek/lock mismatches and empty lookups are unverified, not reusable. */
export function resolveProviderLookupForClaim({
  lockedProviderId,
  peekedProviderId,
  lookup,
}: {
  lockedProviderId: string | null | undefined;
  peekedProviderId: string | null | undefined;
  lookup: ProviderLookup;
}): ProviderLookup {
  const locked = lockedProviderId?.trim() || null;
  if (!locked) return { kind: "none" };
  const peeked = peekedProviderId?.trim() || null;
  if (locked !== peeked) return { kind: "unreachable" };
  if (lookup.kind === "none") return { kind: "unreachable" };
  return lookup;
}

export function evaluateCheckoutClaim({
  existing,
  requestId,
  planId,
  now,
  creatingInFlightMs = CREATING_IN_FLIGHT_MS,
  provider,
}: {
  existing: CheckoutAttemptSnapshot | null;
  requestId: string;
  planId: Extract<PlanId, "starter" | "professional">;
  now: number;
  creatingInFlightMs?: number;
  provider: ProviderLookup;
}): CheckoutClaimDecision {
  if (!existing) return { action: "insert" };

  const attemptStatus = existing.status.toLowerCase();
  if (attemptStatus === "scheduled" && existing.planId === planId) {
    return { action: "scheduled" };
  }

  if (TERMINAL_CHECKOUT_ATTEMPT_STATUSES.has(attemptStatus)) {
    const previousId = existing.providerSubscriptionId?.trim();
    return previousId
      ? { action: "replace", cancelProviderId: previousId }
      : { action: "replace" };
  }

  const providerId = existing.providerSubscriptionId?.trim() || null;
  const creatingInFlight =
    attemptStatus === "creating" &&
    !providerId &&
    now - existing.updatedAt.getTime() < creatingInFlightMs;

  if (creatingInFlight) {
    return { action: "conflict" };
  }

  if (!providerId) {
    return { action: "replace" };
  }

  if (provider.kind === "none" || provider.kind === "unreachable") {
    return { action: "conflict" };
  }

  const providerStatus = provider.status.toLowerCase();
  if (providerStatus === "active") {
    return { action: "already_active" };
  }
  if (TERMINAL_PROVIDER_STATUSES.has(providerStatus)) {
    return { action: "replace" };
  }
  if (
    providerStatus === CHECKOUT_REUSABLE_PROVIDER_STATUS &&
    existing.planId === planId
  ) {
    return { action: "reuse" };
  }
  if (
    providerStatus === CHECKOUT_REUSABLE_PROVIDER_STATUS &&
    existing.planId !== planId
  ) {
    return { action: "replace", cancelProviderId: providerId };
  }
  if (attemptStatus === "scheduled") {
    return { action: "conflict" };
  }
  return { action: "conflict" };
}
