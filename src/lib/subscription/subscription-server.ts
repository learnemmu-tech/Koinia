import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";
import {
  getChurchIdsForOrganization,
  resolveTenantScopeForChurch,
} from "@/lib/organization/resolve-tenant-scope";
import type { ChurchSubscription, SubscriptionSnapshot } from "@/types/subscription";

import { resolveFeatureFlagsFromSubscription } from "./features";
import {
  buildUsageChecks,
  getPlanLimits,
} from "./limits";
import { getPlan } from "./plans";
import {
  buildDefaultSubscription,
  buildSubscriptionCreatePayload,
  normalizeSubscriptionFromFirestore,
  SUBSCRIPTIONS_COLLECTION,
} from "./subscription-firestore";
import { computeOrganizationUsage } from "./usage-server";

export async function getSubscriptionByOrganizationId(
  organizationId: string
): Promise<ChurchSubscription> {
  const adminDb = getAdminDb();
  const orgId = organizationId.trim();

  if (!adminDb || !orgId) {
    return buildDefaultSubscription(orgId || "default");
  }

  try {
    const snap = await adminDb
      .collection(SUBSCRIPTIONS_COLLECTION)
      .doc(orgId)
      .get();

    if (!snap.exists) {
      return buildDefaultSubscription(orgId);
    }

    return normalizeSubscriptionFromFirestore(
      snap.id,
      snap.data() as Record<string, unknown>
    );
  } catch (error) {
    console.error("[subscription] org read failed:", error);
    return buildDefaultSubscription(orgId);
  }
}

/**
 * Legacy resolver — maps church to parent organization subscription.
 * Falls back to church-scoped subscription doc for unmigrated installs.
 */
export async function getSubscriptionByChurchId(
  churchId: string
): Promise<ChurchSubscription> {
  const scope = await resolveTenantScopeForChurch(churchId);

  if (scope.organizationId) {
    return getSubscriptionByOrganizationId(scope.organizationId);
  }

  const adminDb = getAdminDb();
  if (!adminDb) {
    return buildDefaultSubscription(churchId);
  }

  try {
    const snap = await adminDb
      .collection(SUBSCRIPTIONS_COLLECTION)
      .doc(churchId)
      .get();

    if (!snap.exists) {
      return buildDefaultSubscription(churchId);
    }

    return normalizeSubscriptionFromFirestore(
      snap.id,
      snap.data() as Record<string, unknown>
    );
  } catch (error) {
    console.error("[subscription] legacy church read failed:", error);
    return buildDefaultSubscription(churchId);
  }
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
  const adminDb = getAdminDb();
  const orgId = organizationId.trim();

  if (!adminDb || !orgId) {
    return buildDefaultSubscription(orgId || "default");
  }

  const ref = adminDb.collection(SUBSCRIPTIONS_COLLECTION).doc(orgId);
  const snap = await ref.get();

  if (snap.exists) {
    return normalizeSubscriptionFromFirestore(
      snap.id,
      snap.data() as Record<string, unknown>
    );
  }

  const payload = buildSubscriptionCreatePayload(orgId);
  await ref.set(payload);

  return normalizeSubscriptionFromFirestore(orgId, payload);
}

export { getChurchIdsForOrganization };
