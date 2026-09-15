import type { ChurchSubscription, TrialLifecycle } from "@/types/subscription";

export const TRIAL_DURATION_DAYS = 14;
export const SHEPHERD_TRIAL_DAYS = 10;
export const TRIAL_EXPIRED_MESSAGE =
  "Your 14-day trial has ended. Existing content is preserved and remains available to view.";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function getTrialEndDate(trialStart: Date): Date {
  return new Date(trialStart.getTime() + TRIAL_DURATION_DAYS * MS_PER_DAY);
}

export function getTrialLifecycle(
  subscription: Pick<
    ChurchSubscription,
    "planId" | "status" | "trialStart" | "trialEnd"
  >,
  now = Date.now()
): TrialLifecycle {
  if (subscription.planId !== "free") {
    return {
      isTrial: false,
      phase: "none",
      daysIntoTrial: null,
      daysRemaining: null,
      shepherdAiAvailable: true,
      shepherdDaysRemaining: null,
    };
  }

  const trialStart = subscription.trialStart;
  const trialEnd = subscription.trialEnd;
  const hasWindow = trialStart != null && trialEnd != null;

  if (!hasWindow) {
    return {
      isTrial: subscription.status === "trialing",
      phase: "none",
      daysIntoTrial: null,
      daysRemaining: null,
      shepherdAiAvailable: true,
      shepherdDaysRemaining: null,
    };
  }

  const daysIntoTrial = Math.max(
    1,
    Math.floor((now - trialStart) / MS_PER_DAY) + 1
  );
  const daysRemaining = Math.max(0, Math.ceil((trialEnd - now) / MS_PER_DAY));
  const expired = now >= trialEnd || daysIntoTrial > TRIAL_DURATION_DAYS;
  const shepherdAiAvailable =
    !expired && daysIntoTrial <= SHEPHERD_TRIAL_DAYS;
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
    daysIntoTrial,
    daysRemaining,
    shepherdAiAvailable,
    shepherdDaysRemaining,
  };
}
