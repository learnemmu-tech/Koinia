import assert from "node:assert/strict";
import test from "node:test";

import {
  resolvePricingPaidPlanCta,
  resolvePricingTrialCta,
} from "../src/lib/subscription/trial.ts";

const now = Date.parse("2026-11-27T00:00:00.000Z");
const futureEnd = now + 30 * 24 * 60 * 60 * 1000;

const activeTrial = { access: "trial" as const, isTrial: true };

test("Starter active shows Current Plan on Starter", () => {
  const cta = resolvePricingPaidPlanCta({
    planId: "starter",
    subscription: {
      planId: "starter",
      status: "active",
      currentPeriodEnd: futureEnd,
      cancelAtPeriodEnd: false,
    },
    loading: false,
    now,
  });
  assert.deepEqual(cta, { kind: "current_plan" });
});

test("Pro active shows Current Plan on Pro", () => {
  const cta = resolvePricingPaidPlanCta({
    planId: "professional",
    subscription: {
      planId: "professional",
      status: "active",
      currentPeriodEnd: futureEnd,
      cancelAtPeriodEnd: false,
    },
    loading: false,
    now,
  });
  assert.deepEqual(cta, { kind: "current_plan" });
  assert.notEqual(
    resolvePricingPaidPlanCta({
      planId: "starter",
      subscription: {
        planId: "professional",
        status: "active",
        currentPeriodEnd: futureEnd,
        cancelAtPeriodEnd: false,
      },
      loading: false,
      now,
    }).kind,
    "current_plan"
  );
});

test("active free trial marks the trial CTA and upgrade on paid plans", () => {
  assert.equal(
    resolvePricingTrialCta({ trial: activeTrial, loading: false }),
    "current_trial"
  );
  assert.deepEqual(
    resolvePricingPaidPlanCta({
      planId: "starter",
      subscription: {
        planId: "free",
        status: "trialing",
        cancelAtPeriodEnd: false,
      },
      trial: activeTrial,
      loading: false,
      now,
    }),
    { kind: "upgrade", label: "Upgrade" }
  );
});

test("no active subscription keeps the subscribe CTA on paid plans", () => {
  assert.deepEqual(
    resolvePricingPaidPlanCta({
      planId: "starter",
      loading: false,
      now,
    }),
    { kind: "subscribe", label: "Start Subscription" }
  );
  assert.equal(
    resolvePricingTrialCta({ loading: false }),
    "signup"
  );
});

test("pending incomplete payment is not shown as Current Plan", () => {
  const cta = resolvePricingPaidPlanCta({
    planId: "starter",
    subscription: {
      planId: "starter",
      status: "incomplete",
      cancelAtPeriodEnd: false,
    },
    loading: false,
    now,
  });
  assert.deepEqual(cta, { kind: "pending" });
  assert.notEqual(cta.kind, "current_plan");
});

test("cancelled subscription with remaining paid access still shows Current Plan", () => {
  const cta = resolvePricingPaidPlanCta({
    planId: "starter",
    subscription: {
      planId: "starter",
      status: "canceled",
      currentPeriodEnd: futureEnd,
      cancelAtPeriodEnd: true,
    },
    loading: false,
    now,
  });
  assert.deepEqual(cta, { kind: "current_plan" });
});

test("loading does not fall through to Start Subscription", () => {
  assert.deepEqual(
    resolvePricingPaidPlanCta({
      planId: "starter",
      loading: true,
      now,
    }),
    { kind: "loading" }
  );
  assert.equal(resolvePricingTrialCta({ loading: true }), "loading");
});
