import type {
  ChurchSubscription,
  FeatureFlagKey,
  PlanId,
  SubscriptionFeatureFlags,
} from "@/types/subscription";

import { getPlan } from "./plans";

export function resolveFeatureFlags(
  planId: PlanId,
  overrides?: Partial<SubscriptionFeatureFlags>
): SubscriptionFeatureFlags {
  const base = getPlan(planId).features;
  if (!overrides) return { ...base };
  return { ...base, ...overrides };
}

export function resolveFeatureFlagsFromSubscription(
  subscription: Pick<ChurchSubscription, "planId" | "featureFlags">
): SubscriptionFeatureFlags {
  return resolveFeatureFlags(
    subscription.planId,
    subscription.featureFlags
  );
}

export function hasFeature(
  features: SubscriptionFeatureFlags,
  key: FeatureFlagKey
): boolean {
  return Boolean(features[key]);
}

export function canUseFeature(
  subscription: Pick<ChurchSubscription, "planId" | "featureFlags">,
  key: FeatureFlagKey
): boolean {
  return hasFeature(resolveFeatureFlagsFromSubscription(subscription), key);
}
