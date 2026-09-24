import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { organizations, subscriptions } from "@/db/schema";
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
import {
  getTrialLifecycle,
  resolveTrialWindow,
  TRIAL_DURATION_DAYS,
  TRIAL_EXPIRED_MESSAGE,
} from "./trial";
import { computeOrganizationUsage } from "./usage-server";

async function getOrganizationCreatedAt(
  organizationId: string
): Promise<Date | null> {
  const [row] = await db
    .select({ createdAt: organizations.createdAt })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);
  return row?.createdAt ?? null;
}

function applyTrialWindow(
  subscription: ChurchSubscription,
  fallbackStart: Date | null
): ChurchSubscription {
  const window = resolveTrialWindow(subscription, fallbackStart);
  if (!window) return subscription;
  return {
    ...subscription,
    trialStart: window.trialStart,
    trialEnd: window.trialEnd,
  };
}

async function persistMissingTrialWindow(
  organizationId: string,
  window: { trialStart: number; trialEnd: number }
): Promise<void> {
  await db
    .update(subscriptions)
    .set({
      trialStart: new Date(window.trialStart),
      trialEnd: new Date(window.trialEnd),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(subscriptions.organizationId, organizationId),
        sql`${subscriptions.trialStart} is null`,
        sql`${subscriptions.trialEnd} is null`,
        eq(subscriptions.planId, "free")
      )
    );
}

/** Idempotent: fills missing free-trial dates from organization.created_at only. */
export async function persistLegacyTrialWindows(): Promise<number> {
  const result = await db.execute(sql`
    UPDATE subscriptions AS s
    SET
      trial_start = o.created_at,
      trial_end = o.created_at + (${TRIAL_DURATION_DAYS}::int * interval '1 day'),
      updated_at = now()
    FROM organizations AS o
    WHERE s.organization_id = o.id
      AND s.plan_id = 'free'
      AND s.trial_start IS NULL
      AND s.trial_end IS NULL
  `);
  return Number((result as { rowCount?: number | null }).rowCount ?? 0);
}

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
  const orgId = organizationId.trim();
  const createdAt = orgId ? await getOrganizationCreatedAt(orgId) : null;
  const loaded =
    preloadedSubscription ??
    (orgId ? await getSubscriptionByOrganizationId(orgId) : buildDefaultSubscription("default"));
  const window = resolveTrialWindow(loaded, createdAt);
  if (
    orgId &&
    loaded.planId === "free" &&
    loaded.trialStart == null &&
    loaded.trialEnd == null &&
    window
  ) {
    await persistMissingTrialWindow(orgId, window).catch((error) => {
      console.error("[subscription] trial window backfill failed", {
        organizationId: orgId,
        error: error instanceof Error ? error.message : "unknown",
      });
    });
  }
  const subscription = applyTrialWindow(loaded, createdAt);
  const trial = getTrialLifecycle(subscription, Date.now(), createdAt);
  const paid = trial.access === "paid";
  const limits = getPlanLimits(paid ? subscription.planId : "free");
  const features = resolveFeatureFlagsFromSubscription(subscription, createdAt);
  const usage = await computeOrganizationUsage(orgId || subscription.organizationId);
  const usageChecks = buildUsageChecks(usage, limits);

  return {
    subscription,
    plan: getPlan(subscription.planId),
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
  if (snapshot.trial.access === "expired" || snapshot.trial.phase === "expired") {
    throw new SubscriptionLimitError(TRIAL_EXPIRED_MESSAGE);
  }
}

export async function assertSubscriptionWritable(
  organizationId: string
): Promise<void> {
  const orgId = organizationId.trim();
  if (!orgId) {
    throw new SubscriptionLimitError(TRIAL_EXPIRED_MESSAGE);
  }
  assertTrialWritable(await getSubscriptionSnapshot(orgId));
}

export async function assertUsageAllowed(
  organizationId: string,
  key: UsageLimitKey
): Promise<void> {
  const orgId = organizationId.trim();
  if (!orgId) {
    throw new SubscriptionLimitError(TRIAL_EXPIRED_MESSAGE);
  }
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
  if (!orgId) {
    throw new SubscriptionLimitError(
      key === "canUseShepherdAi"
        ? "Shepherd AI is not available for this workspace."
        : TRIAL_EXPIRED_MESSAGE
    );
  }
  const snapshot = await getSubscriptionSnapshot(orgId);
  if (key === "canUseShepherdAi") {
    if (!snapshot.features.canUseShepherdAi) {
      throw new SubscriptionLimitError(
        snapshot.trial.isTrial
          ? "Shepherd AI is available for the first 10 days of your 14-day trial."
          : snapshot.trial.access === "expired"
            ? TRIAL_EXPIRED_MESSAGE
            : "This feature is not included in your current plan."
      );
    }
    return;
  }
  assertTrialWritable(snapshot);
  if (!snapshot.features[key]) {
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
  if (!organizationId) {
    throw new SubscriptionLimitError(TRIAL_EXPIRED_MESSAGE);
  }
  await assertUsageAllowed(organizationId, key);
}

export async function assertChurchFeatureAllowed(
  churchId: string,
  key: FeatureFlagKey
): Promise<void> {
  const church = await getChurchById(churchId);
  const organizationId = church?.organizationId?.trim();
  if (!organizationId) {
    throw new SubscriptionLimitError(TRIAL_EXPIRED_MESSAGE);
  }
  await assertFeatureAllowed(organizationId, key);
}

export async function assertChurchContentWritable(churchId: string): Promise<void> {
  const church = await getChurchById(churchId);
  const organizationId = church?.organizationId?.trim();
  if (!organizationId) {
    throw new SubscriptionLimitError(TRIAL_EXPIRED_MESSAGE);
  }
  await assertSubscriptionWritable(organizationId);
}
