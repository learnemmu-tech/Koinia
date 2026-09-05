import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { resolveTenantScopeForChurch } from "@/lib/organization/resolve-tenant-scope";
import { getChurchIdsForOrganization } from "@/lib/postgres/tenants";
import { mapSubscription } from "@/lib/postgres/mappers";
import { ensureSubscriptionDocument as ensurePgSubscription } from "@/lib/postgres/tenants";
import type { ChurchSubscription, SubscriptionSnapshot } from "@/types/subscription";

import { resolveFeatureFlagsFromSubscription } from "./features";
import { buildUsageChecks, getPlanLimits } from "./limits";
import { getPlan } from "./plans";
import { buildDefaultSubscription } from "./subscription-firestore";
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
  organizationId: string
): Promise<SubscriptionSnapshot> {
  const subscription = await getSubscriptionByOrganizationId(organizationId);
  const plan = getPlan(subscription.planId);
  const limits = getPlanLimits(subscription.planId);
  const features = resolveFeatureFlagsFromSubscription(subscription);
  const usage = await computeOrganizationUsage(organizationId);
  const usageChecks = buildUsageChecks(usage, limits);

  return {
    subscription,
    plan,
    features,
    limits,
    usage,
    usageChecks,
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
