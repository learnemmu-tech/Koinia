import type {
  PlanLimits,
  SubscriptionAccess,
  SubscriptionFeatureFlags,
  UsageLimitKey,
} from "@/types/subscription";

/**
 * TEMPORARY development entitlement while Razorpay paid activation is not
 * operational. Applies only to organizations in an active 14-day trial.
 *
 * Set `TEMPORARY_TRIAL_CONTENT_ALLOWANCE_ENABLED` to false once paid
 * subscriptions work — `getPlanLimits` / paid feature flags then apply as-is.
 * Do not treat this as a permanent pricing-model change.
 */
/** Plan catalog limits are enforced as-is. Do not raise trial caps here. */
export const TEMPORARY_TRIAL_CONTENT_ALLOWANCE_ENABLED = false;

export const TEMPORARY_TRIAL_CONTENT_ALLOWANCE = {
  events: 3,
  donationCampaigns: 3,
  books: 3,
} as const;

export function applyTemporaryTrialContentAllowance(
  access: SubscriptionAccess,
  limits: PlanLimits,
  features: SubscriptionFeatureFlags
): { limits: PlanLimits; features: SubscriptionFeatureFlags } {
  if (!TEMPORARY_TRIAL_CONTENT_ALLOWANCE_ENABLED || access !== "trial") {
    return { limits, features };
  }

  const donationsIncluded =
    features.canCreateDonations || (limits.donationCampaigns ?? 0) !== 0;

  return {
    limits: {
      ...limits,
      events: TEMPORARY_TRIAL_CONTENT_ALLOWANCE.events,
      books: TEMPORARY_TRIAL_CONTENT_ALLOWANCE.books,
      ...(donationsIncluded
        ? { donationCampaigns: TEMPORARY_TRIAL_CONTENT_ALLOWANCE.donationCampaigns }
        : {}),
    },
    features: {
      ...features,
      canCreateEvents: true,
      ...(donationsIncluded ? { canCreateDonations: true } : {}),
    },
  };
}

export function isTemporaryTrialAllowanceLimitKey(
  key: UsageLimitKey
): boolean {
  return (
    key === "events" || key === "donationCampaigns" || key === "books"
  );
}

export function getTemporaryTrialAllowanceExhaustedMessage(
  key: UsageLimitKey
): string {
  const cap =
    key === "events"
      ? TEMPORARY_TRIAL_CONTENT_ALLOWANCE.events
      : key === "donationCampaigns"
        ? TEMPORARY_TRIAL_CONTENT_ALLOWANCE.donationCampaigns
        : TEMPORARY_TRIAL_CONTENT_ALLOWANCE.books;
  const label =
    key === "events"
      ? "events"
      : key === "donationCampaigns"
        ? "donation campaigns"
        : "books";
  return `Your church has reached the temporary trial limit of ${cap} ${label}. New items cannot be created while paid subscription activation is unavailable.`;
}
