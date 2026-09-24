import type {
  ChurchSubscription,
  SubscriptionFeatureFlags,
  TrialLifecycle,
} from "@/types/subscription";

export const TRIAL_DURATION_DAYS = 14;
export const SHEPHERD_TRIAL_DAYS = 10;
export const TRIAL_EXPIRED_MESSAGE =
  "Your 14-day trial has ended. Existing content is preserved and remains available to view. Upgrade your plan to continue creating and managing your church.";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type TrialLifecycleEventKey =
  | "trial_day_8"
  | "trial_day_10"
  | "trial_day_12"
  | "trial_day_13"
  | "trial_day_14"
  | "trial_expired";

export type SubscriptionEntitlement = "paid" | "trial" | "expired";

type EntitlementSubscription = Pick<
  ChurchSubscription,
  | "planId"
  | "status"
  | "trialStart"
  | "trialEnd"
  | "currentPeriodEnd"
  | "cancelAtPeriodEnd"
>;

export const EXPIRED_FEATURE_FLAGS: SubscriptionFeatureFlags = {
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
};

export function getTrialEndDate(trialStart: Date): Date {
  return new Date(trialStart.getTime() + TRIAL_DURATION_DAYS * MS_PER_DAY);
}

export function hasActivePaidEntitlement(
  subscription: EntitlementSubscription,
  now = Date.now()
): boolean {
  if (subscription.planId === "free") return false;
  const periodOpen =
    subscription.currentPeriodEnd == null ||
    subscription.currentPeriodEnd > now;
  if (!periodOpen) return false;
  if (subscription.status === "active") return true;
  if (subscription.status === "past_due") return true;
  if (
    subscription.status === "canceled" &&
    (subscription.cancelAtPeriodEnd || periodOpen)
  ) {
    return true;
  }
  return false;
}

export function resolveTrialWindow(
  subscription: Pick<ChurchSubscription, "trialStart" | "trialEnd">,
  fallbackStart?: number | Date | null,
  now = Date.now()
): { trialStart: number; trialEnd: number } | null {
  let trialStart = subscription.trialStart ?? undefined;
  let trialEnd = subscription.trialEnd ?? undefined;
  const fallback =
    fallbackStart instanceof Date ? fallbackStart.getTime() : fallbackStart ?? undefined;

  if (trialStart == null && trialEnd == null && fallback != null) {
    trialStart = fallback;
  }
  if (trialStart == null && trialEnd != null) {
    trialStart = trialEnd - TRIAL_DURATION_DAYS * MS_PER_DAY;
  }
  if (trialStart != null && trialEnd == null) {
    trialEnd = getTrialEndDate(new Date(trialStart)).getTime();
  }
  if (trialStart == null || trialEnd == null) return null;
  void now;
  return { trialStart, trialEnd };
}

export function getSubscriptionEntitlement(
  subscription: EntitlementSubscription,
  now = Date.now(),
  fallbackStart?: number | Date | null
): SubscriptionEntitlement {
  if (hasActivePaidEntitlement(subscription, now)) return "paid";
  const window = resolveTrialWindow(subscription, fallbackStart, now);
  if (!window) return "expired";
  return now >= window.trialEnd ? "expired" : "trial";
}

export function getDueTrialLifecycleEventKeys(
  lifecycle: TrialLifecycle
): TrialLifecycleEventKey[] {
  if (lifecycle.access === "paid") return [];
  if (lifecycle.phase === "expired" || lifecycle.access === "expired") {
    return ["trial_expired"];
  }
  if (!lifecycle.isTrial || lifecycle.daysIntoTrial == null) return [];

  const days = lifecycle.daysIntoTrial;
  const keys: TrialLifecycleEventKey[] = [];
  if (days >= 8) keys.push("trial_day_8");
  if (days >= 10) keys.push("trial_day_10");
  if (days >= 12) keys.push("trial_day_12");
  if (days >= 13) keys.push("trial_day_13");
  if (days >= 14) keys.push("trial_day_14");
  return keys;
}

export function getTrialLifecycle(
  subscription: EntitlementSubscription,
  now = Date.now(),
  fallbackStart?: number | Date | null
): TrialLifecycle {
  if (hasActivePaidEntitlement(subscription, now)) {
    return {
      isTrial: false,
      phase: "none",
      access: "paid",
      daysIntoTrial: null,
      daysRemaining: null,
      shepherdAiAvailable: true,
      shepherdDaysRemaining: null,
    };
  }

  const window = resolveTrialWindow(subscription, fallbackStart, now);
  if (!window) {
    return {
      isTrial: false,
      phase: "expired",
      access: "expired",
      daysIntoTrial: null,
      daysRemaining: null,
      shepherdAiAvailable: false,
      shepherdDaysRemaining: 0,
    };
  }

  const { trialStart, trialEnd } = window;
  const expired = now >= trialEnd;
  const daysIntoTrial = Math.max(
    1,
    Math.floor((now - trialStart) / MS_PER_DAY) + 1
  );
  const daysRemaining = expired
    ? 0
    : Math.max(0, Math.ceil((trialEnd - now) / MS_PER_DAY));
  const shepherdAiAvailable = !expired && daysIntoTrial <= SHEPHERD_TRIAL_DAYS;
  const shepherdDaysRemaining = shepherdAiAvailable
    ? Math.max(0, SHEPHERD_TRIAL_DAYS - daysIntoTrial + 1)
    : 0;

  let phase: TrialLifecycle["phase"] = "active";
  if (expired) phase = "expired";
  else if (daysIntoTrial >= 12) phase = "urgent";
  else if (daysIntoTrial >= 8) phase = "reminder";

  return {
    isTrial: true,
    phase,
    access: expired ? "expired" : "trial",
    daysIntoTrial,
    daysRemaining,
    shepherdAiAvailable,
    shepherdDaysRemaining,
  };
}
