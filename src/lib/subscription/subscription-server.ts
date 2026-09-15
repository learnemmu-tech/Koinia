import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { resolveTenantScopeForChurch } from "@/lib/organization/resolve-tenant-scope";
import {
  getChurchById,
  getChurchIdsForOrganization,
} from "@/lib/postgres/tenants";
import { mapSubscription } from "@/lib/postgres/mappers";
import { ensureSubscriptionDocument as ensurePgSubscription } from "@/lib/postgres/tenants";
import type {
  ChurchSubscription,
  FeatureFlagKey,
  SubscriptionSnapshot,
  UsageLimitKey,
} from "@/types/subscription";

import { resolveFeatureFlagsFromSubscription } from "./features";
import {
  buildUsageChecks,
  getLimitExceededMessage,
  getPlanLimits,
} from "./limits";
import { getPlan } from "./plans";
import { buildDefaultSubscription } from "./subscription-firestore";
import { getTrialLifecycle, TRIAL_EXPIRED_MESSAGE } from "./trial";
import { computeOrganizationUsage } from "./usage-server";

export async function getSubscriptionByOrganizationId(
  organizationId: string
): Promise<ChurchSubscription> {
  const orgId = organizationId.trim();
  if (!orgId) return buildDefaultSubscription("default");

  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, orgId))
    .limit(1);

  if (!row) return buildDefaultSubscription(orgId);
  return mapSubscription(row);
}

export async function getSubscriptionByChurchId(
  churchId: string
): Promise<ChurchSubscription> {
  const scope = await resolveTenantScopeForChurch(churchId);
  if (scope.organizationId) {
    return getSubscriptionByOrganizationId(scope.organizationId);
  }
  return buildDefaultSubscription(churchId);
}

export async function getSubscriptionSnapshot(
  organizationId: string,
  preloadedSubscription?: ChurchSubscription
): Promise<SubscriptionSnapshot> {
  const subscription =
    preloadedSubscription ??
    (await getSubscriptionByOrganizationId(organizationId));
  const plan = getPlan(subscription.planId);
  const limits = getPlanLimits(subscription.planId);
  const features = resolveFeatureFlagsFromSubscription(subscription);
  const usage = await computeOrganizationUsage(organizationId);
  const usageChecks = buildUsageChecks(usage, limits);
  const trial = getTrialLifecycle(subscription);

  return {
    subscription,
    plan,
    features,
    limits,
    usage,
    usageChecks,
    trial,
  };
}

export async function getSubscriptionSnapshotForChurch(
  churchId: string
): Promise<SubscriptionSnapshot> {
  const scope = await resolveTenantScopeForChurch(churchId);
  const organizationId = scope.organizationId || churchId;
  return getSubscriptionSnapshot(organizationId);
}

export async function ensureSubscriptionDocument(
  organizationId: string
): Promise<ChurchSubscription> {
  const row = await ensurePgSubscription(organizationId);
  if (!row) return buildDefaultSubscription(organizationId || "default");
  return mapSubscription(row);
}

export { getChurchIdsForOrganization };

export class SubscriptionLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SubscriptionLimitError";
  }
}

export function isSubscriptionLimitError(
  error: unknown
): error is SubscriptionLimitError {
  return (
    error instanceof SubscriptionLimitError ||
    (error instanceof Error && error.name === "SubscriptionLimitError")
  );
}

function assertTrialWritable(snapshot: SubscriptionSnapshot): void {
  if (snapshot.trial.phase === "expired") {
    throw new SubscriptionLimitError(TRIAL_EXPIRED_MESSAGE);
  }
}

export async function assertUsageAllowed(
  organizationId: string,
  key: UsageLimitKey
): Promise<void> {
  const orgId = organizationId.trim();
  if (!orgId) return;
  const snapshot = await getSubscriptionSnapshot(orgId);
  assertTrialWritable(snapshot);
  const check = snapshot.usageChecks.find((item) => item.key === key);
  if (check?.atLimit) {
    throw new SubscriptionLimitError(
      getLimitExceededMessage(key, snapshot.plan.name)
    );
  }
}

export async function assertFeatureAllowed(
  organizationId: string,
  key: FeatureFlagKey
): Promise<void> {
  const orgId = organizationId.trim();
  if (!orgId) return;
  const snapshot = await getSubscriptionSnapshot(orgId);
  assertTrialWritable(snapshot);
  if (!snapshot.features[key]) {
    if (key === "canUseShepherdAi" && snapshot.trial.isTrial) {
      throw new SubscriptionLimitError(
        "Shepherd AI is available for the first 10 days of your 14-day trial."
      );
    }
    throw new SubscriptionLimitError(
      "This feature is not included in your current plan."
    );
  }
}

export async function assertChurchUsageAllowed(
  churchId: string,
  key: UsageLimitKey
): Promise<void> {
  const church = await getChurchById(churchId);
  const organizationId = church?.organizationId?.trim();
  if (!organizationId) return;
  await assertUsageAllowed(organizationId, key);
}

export async function assertChurchFeatureAllowed(
  churchId: string,
  key: FeatureFlagKey
): Promise<void> {
  const church = await getChurchById(churchId);
  const organizationId = church?.organizationId?.trim();
  if (!organizationId) return;
  await assertFeatureAllowed(organizationId, key);
}
