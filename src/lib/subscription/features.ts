import type {
  ChurchSubscription,
  FeatureFlagKey,
  PlanId,
  SubscriptionFeatureFlags,
} from "@/types/subscription";

import { getPlan } from "./plans";
import {
  EXPIRED_FEATURE_FLAGS,
  getTrialLifecycle,
  hasActivePaidEntitlement,
} from "./trial";

export function resolveFeatureFlags(
  planId: PlanId,
  overrides?: Partial<SubscriptionFeatureFlags>
): SubscriptionFeatureFlags {
  const base = getPlan(planId).features;
  if (!overrides) return { ...base };
  return { ...base, ...overrides };
}

export function resolveFeatureFlagsFromSubscription(
  subscription: Pick<
    ChurchSubscription,
    | "planId"
    | "featureFlags"
    | "status"
    | "trialStart"
    | "trialEnd"
    | "currentPeriodEnd"
    | "cancelAtPeriodEnd"
  >,
  fallbackStart?: number | Date | null
): SubscriptionFeatureFlags {
  if (hasActivePaidEntitlement(subscription)) {
    return resolveFeatureFlags(subscription.planId, subscription.featureFlags);
  }

  const trial = getTrialLifecycle(subscription, Date.now(), fallbackStart);
  if (trial.access === "expired" || trial.phase === "expired") {
    return { ...EXPIRED_FEATURE_FLAGS };
  }

  const flags = resolveFeatureFlags("free", subscription.featureFlags);
  return {
    ...flags,
    canUseShepherdAi: trial.shepherdAiAvailable,
  };
}

export function hasFeature(
  features: SubscriptionFeatureFlags,
  key: FeatureFlagKey
): boolean {
  return Boolean(features[key]);
}

export function canUseFeature(
  subscription: Pick<
    ChurchSubscription,
    | "planId"
    | "featureFlags"
    | "status"
    | "trialStart"
    | "trialEnd"
    | "currentPeriodEnd"
    | "cancelAtPeriodEnd"
  >,
  key: FeatureFlagKey,
  fallbackStart?: number | Date | null
): boolean {
  return hasFeature(
    resolveFeatureFlagsFromSubscription(subscription, fallbackStart),
    key
  );
}
