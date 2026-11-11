import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { isPurchasablePlan, getPlan } from "@/lib/subscription/plans";
import { getTrialEndDate } from "@/lib/subscription/trial";
import type { BillingInterval, PlanId } from "@/types/subscription";

export type ActivateOnboardingTrialResult = {
  organizationId: string;
  planId: PlanId;
  planName: string;
  billingInterval: BillingInterval;
  trialStart: string;
  trialEnd: string;
  alreadyActive: boolean;
};

export async function saveOnboardingPlan(input: {
  organizationId: string;
  planId: string;
  billingInterval: BillingInterval;
}): Promise<{ planId: PlanId; billingInterval: BillingInterval }> {
  if (!isPurchasablePlan(input.planId)) {
    throw new Error("This plan is not available");
  }
  if (input.billingInterval !== "monthly" && input.billingInterval !== "yearly") {
    throw new Error("Choose monthly or annual billing");
  }

  const [updated] = await db
    .update(subscriptions)
    .set({
      planId: input.planId,
      billingInterval: input.billingInterval,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(subscriptions.organizationId, input.organizationId),
        eq(subscriptions.status, "incomplete")
      )
    )
    .returning({
      planId: subscriptions.planId,
      billingInterval: subscriptions.billingInterval,
    });

  if (updated?.billingInterval) {
    return { planId: updated.planId, billingInterval: updated.billingInterval };
  }

  const [trialing] = await db
    .update(subscriptions)
    .set({
      planId: input.planId,
      billingInterval: input.billingInterval,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(subscriptions.organizationId, input.organizationId),
        eq(subscriptions.status, "trialing")
      )
    )
    .returning({
      planId: subscriptions.planId,
      billingInterval: subscriptions.billingInterval,
    });

  if (trialing?.billingInterval) {
    return { planId: trialing.planId, billingInterval: trialing.billingInterval };
  }

  const [existing] = await db
    .select({ status: subscriptions.status, trialStart: subscriptions.trialStart })
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, input.organizationId))
    .limit(1);

  if (existing && (existing.status === "trialing" || existing.status === "active")) {
    throw new Error("This organization already has a subscription");
  }
  throw new Error("Unable to save the selected plan");
}

export async function activateStoredOnboardingTrial(
  organizationId: string
): Promise<ActivateOnboardingTrialResult> {
  const [row] = await db
    .select({
      planId: subscriptions.planId,
      billingInterval: subscriptions.billingInterval,
      status: subscriptions.status,
      trialStart: subscriptions.trialStart,
      trialEnd: subscriptions.trialEnd,
    })
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, organizationId))
    .limit(1);

  if (
    row?.trialStart &&
    row.trialEnd &&
    (row.status === "trialing" || row.status === "active")
  ) {
    return {
      organizationId,
      planId: row.planId,
      planName: getPlan(row.planId).name,
      billingInterval: row.billingInterval ?? "monthly",
      trialStart: row.trialStart.toISOString(),
      trialEnd: row.trialEnd.toISOString(),
      alreadyActive: true,
    };
  }

  if (!row || !isPurchasablePlan(row.planId) || !row.billingInterval) {
    throw new Error("Select a subscription plan before starting the trial");
  }

  return activateOnboardingTrial({
    organizationId,
    planId: row.planId,
    billingInterval: row.billingInterval,
  });
}

export async function activateOnboardingTrial(input: {
  organizationId: string;
  planId: string;
  billingInterval: BillingInterval;
}): Promise<ActivateOnboardingTrialResult> {
  if (!isPurchasablePlan(input.planId)) {
    throw new Error("This plan is not available for the free trial");
  }
  if (input.billingInterval !== "monthly" && input.billingInterval !== "yearly") {
    throw new Error("Choose monthly or annual billing");
  }

  const planId = input.planId;
  const now = new Date();
  const trialEnd = getTrialEndDate(now);

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(subscriptions)
      .set({
        planId,
        billingInterval: input.billingInterval,
        status: "trialing",
        trialStart: now,
        trialEnd,
        provider: null,
        updatedAt: now,
      })
      .where(
        and(
          eq(subscriptions.organizationId, input.organizationId),
          eq(subscriptions.status, "incomplete"),
          isNull(subscriptions.trialStart)
        )
      )
      .returning({
        planId: subscriptions.planId,
        billingInterval: subscriptions.billingInterval,
        trialStart: subscriptions.trialStart,
        trialEnd: subscriptions.trialEnd,
        status: subscriptions.status,
      });

    if (updated?.trialStart && updated.trialEnd && updated.billingInterval) {
      return {
        organizationId: input.organizationId,
        planId: updated.planId,
        planName: getPlan(updated.planId).name,
        billingInterval: updated.billingInterval,
        trialStart: updated.trialStart.toISOString(),
        trialEnd: updated.trialEnd.toISOString(),
        alreadyActive: false,
      };
    }

    const [existing] = await tx
      .select({
        planId: subscriptions.planId,
        billingInterval: subscriptions.billingInterval,
        trialStart: subscriptions.trialStart,
        trialEnd: subscriptions.trialEnd,
        status: subscriptions.status,
      })
      .from(subscriptions)
      .where(eq(subscriptions.organizationId, input.organizationId))
      .limit(1);

    if (
      existing?.trialStart &&
      existing.trialEnd &&
      (existing.status === "trialing" || existing.status === "active")
    ) {
      return {
        organizationId: input.organizationId,
        planId: existing.planId,
        planName: getPlan(existing.planId).name,
        billingInterval: existing.billingInterval ?? "monthly",
        trialStart: existing.trialStart.toISOString(),
        trialEnd: existing.trialEnd.toISOString(),
        alreadyActive: true,
      };
    }

    throw new Error("Unable to activate the free trial for this organization");
  });
}
