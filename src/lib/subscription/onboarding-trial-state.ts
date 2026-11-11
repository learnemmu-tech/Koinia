import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { isPurchasablePlan } from "@/lib/subscription/plans";

export type OnboardingBillingStep = "plan" | "urls" | "done";

/** Where billing onboarding should resume. Existing trials and paid plans are done. */
export async function getOnboardingBillingStep(
  organizationId: string | null | undefined
): Promise<OnboardingBillingStep> {
  const orgId = organizationId?.trim();
  if (!orgId) return "done";

  const [row] = await db
    .select({
      status: subscriptions.status,
      planId: subscriptions.planId,
      billingInterval: subscriptions.billingInterval,
      trialStart: subscriptions.trialStart,
    })
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, orgId))
    .limit(1);

  if (!row) return "done";
  if (row.status !== "incomplete" || row.trialStart != null) return "done";
  if (isPurchasablePlan(row.planId) && row.billingInterval) return "urls";
  return "plan";
}
