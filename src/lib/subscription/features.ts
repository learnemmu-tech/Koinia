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
    | "planId"
    | "featureFlags"
    | "status"
    | "trialStart"
    | "trialEnd"
    | "currentPeriodEnd"
  >
): SubscriptionFeatureFlags {
  const paidPeriodExpired =
    subscription.planId !== "free" &&
    subscription.currentPeriodEnd != null &&
    subscription.currentPeriodEnd <= Date.now();
  if (
    subscription.planId !== "free" &&
    (subscription.status !== "active" || paidPeriodExpired)
  ) {
    return resolveFeatureFlags("free");
  }

  const trial = getTrialLifecycle(subscription);
  if (trial.phase === "expired") {
    return resolveFeatureFlags("free", {
      canCreateSongs: false,
      canCreateSermons: false,
      canCreateArticles: false,
      canCreateEvents: false,
      canCreateDonations: false,
      canUseShepherdAi: false,
      canCreateChurches: false,
      canUseEmailNotifications: false,
      canUseAnalytics: false,
      canUseAdvancedAnalytics: false,
      canCustomizeBranding: false,
      canUseEventRegistration: false,
      canInviteAdmins: false,
      canUseWhiteLabel: false,
      canUseCustomDomain: false,
      canUseApiAccess: false,
      hasPrioritySupport: false,
      hasDedicatedSupport: false,
      hasSla: false,
    });
  }

  const flags = resolveFeatureFlags(
    subscription.planId,
    subscription.featureFlags
  );
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
    | "planId"
    | "featureFlags"
    | "status"
    | "trialStart"
    | "trialEnd"
    | "currentPeriodEnd"
  >,
  key: FeatureFlagKey
): boolean {
  return hasFeature(resolveFeatureFlagsFromSubscription(subscription), key);
}
