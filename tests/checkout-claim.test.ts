import assert from "node:assert/strict";
import test from "node:test";

import {
  CREATING_IN_FLIGHT_MS,
  evaluateCheckoutClaim,
  resolveProviderLookupForClaim,
} from "../src/lib/subscription/checkout-claim.ts";

const now = Date.parse("2026-11-26T18:00:00.000Z");

function attempt(
  overrides: Partial<Parameters<typeof evaluateCheckoutClaim>[0]["existing"]> = {}
) {
  return {
    requestId: "req-1",
    planId: "starter",
    status: "pending",
    providerSubscriptionId: "sub_open",
    providerStatus: "created",
    updatedAt: new Date(now - 5_000),
    ...overrides,
  };
}

test("refresh with a new requestId reuses a still-created Razorpay subscription", () => {
  const decision = evaluateCheckoutClaim({
    existing: attempt(),
    requestId: "req-refresh",
    planId: "starter",
    now,
    provider: { kind: "found", status: "created" },
  });
  assert.deepEqual(decision, { action: "reuse" });
});

test("duplicate in-flight create requests conflict without a provider id", () => {
  const decision = evaluateCheckoutClaim({
    existing: attempt({
      status: "creating",
      providerSubscriptionId: null,
      providerStatus: null,
      updatedAt: new Date(now - 1_000),
    }),
    requestId: "req-2",
    planId: "starter",
    now,
    provider: { kind: "none" },
  });
  assert.deepEqual(decision, { action: "conflict" });
});

test("a stale creating row without a provider id can be reclaimed after the in-flight window", () => {
  const decision = evaluateCheckoutClaim({
    existing: attempt({
      status: "creating",
      providerSubscriptionId: null,
      providerStatus: null,
      updatedAt: new Date(now - CREATING_IN_FLIGHT_MS - 1),
    }),
    requestId: "req-2",
    planId: "starter",
    now,
    provider: { kind: "none" },
  });
  assert.deepEqual(decision, { action: "replace" });
});

test("terminal Razorpay or local checkout state allows a new attempt", () => {
  assert.deepEqual(
    evaluateCheckoutClaim({
      existing: attempt({ status: "abandoned" }),
      requestId: "req-2",
      planId: "starter",
      now,
      provider: { kind: "found", status: "created" },
    }),
    { action: "replace", cancelProviderId: "sub_open" }
  );
  assert.deepEqual(
    evaluateCheckoutClaim({
      existing: attempt({ status: "failed" }),
      requestId: "req-2",
      planId: "starter",
      now,
      provider: { kind: "found", status: "cancelled" },
    }),
    { action: "replace", cancelProviderId: "sub_open" }
  );
  for (const status of ["cancelled", "expired", "completed", "failed", "abandoned"]) {
    assert.deepEqual(
      evaluateCheckoutClaim({
        existing: attempt(),
        requestId: "req-2",
        planId: "starter",
        now,
        provider: { kind: "found", status },
      }),
      { action: "replace" }
    );
  }
});

test("an active Razorpay subscription is not replaced with another checkout", () => {
  const decision = evaluateCheckoutClaim({
    existing: attempt({ providerStatus: "active" }),
    requestId: "req-2",
    planId: "starter",
    now,
    provider: { kind: "found", status: "active" },
  });
  assert.deepEqual(decision, { action: "already_active" });
});

test("unreachable or discarded provider lookup never reuses a stored subscription id", () => {
  assert.deepEqual(
    evaluateCheckoutClaim({
      existing: attempt(),
      requestId: "req-refresh",
      planId: "starter",
      now,
      provider: { kind: "unreachable" },
    }),
    { action: "conflict" }
  );
  assert.deepEqual(
    evaluateCheckoutClaim({
      existing: attempt(),
      requestId: "req-refresh",
      planId: "starter",
      now,
      provider: { kind: "none" },
    }),
    { action: "conflict" }
  );
});

test("authenticated and pending provider states are not reopened in Checkout", () => {
  for (const status of ["authenticated", "pending"]) {
    assert.deepEqual(
      evaluateCheckoutClaim({
        existing: attempt({ providerStatus: status }),
        requestId: "req-refresh",
        planId: "starter",
        now,
        provider: { kind: "found", status },
      }),
      { action: "conflict" }
    );
  }
});

test("switching plans while still created replaces and cancels the unused subscription", () => {
  const decision = evaluateCheckoutClaim({
    existing: attempt({ planId: "starter" }),
    requestId: "req-2",
    planId: "professional",
    now,
    provider: { kind: "found", status: "created" },
  });
  assert.deepEqual(decision, {
    action: "replace",
    cancelProviderId: "sub_open",
  });
});

test("peek/lock provider id mismatch is treated as unverified, not reusable", () => {
  assert.deepEqual(
    resolveProviderLookupForClaim({
      lockedProviderId: "sub_locked",
      peekedProviderId: "sub_peeked",
      lookup: { kind: "found", status: "created" },
    }),
    { kind: "unreachable" }
  );
  assert.deepEqual(
    resolveProviderLookupForClaim({
      lockedProviderId: "sub_open",
      peekedProviderId: "sub_open",
      lookup: { kind: "none" },
    }),
    { kind: "unreachable" }
  );
  assert.deepEqual(
    evaluateCheckoutClaim({
      existing: attempt(),
      requestId: "req-2",
      planId: "starter",
      now,
      provider: resolveProviderLookupForClaim({
        lockedProviderId: "sub_open",
        peekedProviderId: "sub_other",
        lookup: { kind: "found", status: "created" },
      }),
    }),
    { action: "conflict" }
  );
});

test("concurrent creating requests conflict instead of creating a second subscription", () => {
  const first = evaluateCheckoutClaim({
    existing: null,
    requestId: "req-1",
    planId: "starter",
    now,
    provider: { kind: "none" },
  });
  const second = evaluateCheckoutClaim({
    existing: attempt({
      status: "creating",
      providerSubscriptionId: null,
      providerStatus: null,
      updatedAt: new Date(now - 500),
    }),
    requestId: "req-2",
    planId: "starter",
    now,
    provider: { kind: "none" },
  });
  assert.deepEqual(first, { action: "insert" });
  assert.deepEqual(second, { action: "conflict" });
});

test("scheduled same-plan checkout is not turned into a new subscription", () => {
  const decision = evaluateCheckoutClaim({
    existing: attempt({ status: "scheduled" }),
    requestId: "req-2",
    planId: "starter",
    now,
    provider: { kind: "found", status: "authenticated" },
  });
  assert.deepEqual(decision, { action: "scheduled" });
});
