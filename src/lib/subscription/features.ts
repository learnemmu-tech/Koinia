import type {
  ChurchSubscription,
  FeatureFlagKey,
  PlanId,
  SubscriptionFeatureFlags,
} from "@/types/subscription";

import { getPlan } from "./plans";
import { getTrialLifecycle } from "./trial";

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
    "planId" | "featureFlags" | "status" | "trialStart" | "trialEnd"
  >
): SubscriptionFeatureFlags {
  const flags = resolveFeatureFlags(
    subscription.planId,
    subscription.featureFlags
  );
  const trial = getTrialLifecycle(subscription);
  return {
    ...flags,
    canUseShepherdAi: trial.isTrial
      ? trial.shepherdAiAvailable
      : flags.canUseShepherdAi,
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
    "planId" | "featureFlags" | "status" | "trialStart" | "trialEnd"
  >,
  key: FeatureFlagKey
): boolean {
  return hasFeature(resolveFeatureFlagsFromSubscription(subscription), key);
}
