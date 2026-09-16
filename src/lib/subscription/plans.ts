import type {
  PlanDefinition,
  PlanId,
  PlanLimits,
  SubscriptionFeatureFlags,
} from "@/types/subscription";

import { SHEPHERD_TRIAL_DAYS, TRIAL_DURATION_DAYS } from "./trial";

const UNLIMITED = null;

function limits(partial: Partial<PlanLimits>): PlanLimits {
  return {
    members: 15,
    songs: 10,
    sermons: 10,
    articles: 10,
    churches: 1,
    admins: 1,
    events: 1,
    donationCampaigns: 0,
    shorts: 5,
    prayerRequests: 5,
    ...partial,
  };
}

const FREE_FEATURES: SubscriptionFeatureFlags = {
  canCreateSongs: true,
  canCreateSermons: true,
  canCreateArticles: true,
  canCreateEvents: true,
  canCreateDonations: false,
  canUseShepherdAi: true,
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

const STARTER_FEATURES: SubscriptionFeatureFlags = {
  ...FREE_FEATURES,
  canCreateDonations: true,
  canUseEmailNotifications: true,
  canUseAnalytics: true,
  canCustomizeBranding: true,
  canInviteAdmins: true,
  hasPrioritySupport: true,
};

const PROFESSIONAL_FEATURES: SubscriptionFeatureFlags = {
  ...STARTER_FEATURES,
  // Multi-church, advanced analytics, and event registration are future
  // positioning only — independent churches are the current product.
  canCreateChurches: false,
  canUseAdvancedAnalytics: false,
  canUseEventRegistration: false,
};

const ENTERPRISE_FEATURES: SubscriptionFeatureFlags = {
  ...PROFESSIONAL_FEATURES,
  canUseWhiteLabel: false,
  canUseCustomDomain: false,
  canUseApiAccess: false,
  hasDedicatedSupport: true,
  hasSla: true,
};

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "14-Day Free Trial",
    badgeName: "Trial",
    tagline: "Explore FaithConnectHub for your church...",
    description:
      "A 14-day trial for a newly created church workspace. Limits apply; donations are not included.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    ctaLabel: "Start 14-day trial",
    limits: limits({}),
    features: FREE_FEATURES,
    highlights: [
      "1 Church",
      "15 Members",
      "10 Songs",
      "10 Sermons",
      "10 Articles",
      "5 Shorts / Videos",
      "1 Event",
      "5 Prayer Requests",
      `Shepherd AI for ${SHEPHERD_TRIAL_DAYS} days`,
      "Donations not included",
    ],
  },
  starter: {
    id: "starter",
    name: "Starter",
    tagline: "Growing ministries",
    description: "For churches ready to scale worship content and engagement.",
    monthlyPrice: 29,
    yearlyPrice: 290,
    limits: limits({
      members: 500,
      songs: UNLIMITED,
      sermons: UNLIMITED,
      articles: UNLIMITED,
      events: UNLIMITED,
      donationCampaigns: UNLIMITED,
      shorts: UNLIMITED,
      prayerRequests: UNLIMITED,
      admins: 2,
    }),
    features: STARTER_FEATURES,
    highlights: [
      "1 Church",
      "500 Members",
      "Unlimited Songs",
      "Unlimited Sermons",
      "Unlimited Articles",
      "Email Notifications",
      "Analytics",
      "Custom Branding",
      "Priority Support",
    ],
  },
  professional: {
    id: "professional",
    name: "Professional",
    tagline: "Multi-campus",
    description: "For ministries managing multiple churches and teams.",
    monthlyPrice: 79,
    yearlyPrice: 790,
    highlighted: true,
    limits: limits({
      members: UNLIMITED,
      songs: UNLIMITED,
      sermons: UNLIMITED,
      articles: UNLIMITED,
      churches: 1,
      admins: 10,
      events: UNLIMITED,
      donationCampaigns: UNLIMITED,
      shorts: UNLIMITED,
      prayerRequests: UNLIMITED,
    }),
    features: PROFESSIONAL_FEATURES,
    highlights: [
      "5 Churches (coming soon)",
      "Unlimited Members",
      "Unlimited Songs",
      "Unlimited Sermons",
      "Advanced Analytics (coming soon)",
      "Event Registration (coming soon)",
      "Multiple Admins",
      "Priority Support",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Custom",
    description: "Custom solutions for large organizations and networks.",
    monthlyPrice: null,
    yearlyPrice: null,
    contactSales: true,
    limits: limits({
      members: UNLIMITED,
      songs: UNLIMITED,
      sermons: UNLIMITED,
      articles: UNLIMITED,
      churches: 1,
      admins: UNLIMITED,
      events: UNLIMITED,
      donationCampaigns: UNLIMITED,
      shorts: UNLIMITED,
      prayerRequests: UNLIMITED,
    }),
    features: ENTERPRISE_FEATURES,
    highlights: [
      "Unlimited Churches (coming soon)",
      "Unlimited Members",
      "White Label (coming soon)",
      "Custom Domain (coming soon)",
      "API Access (coming soon)",
      "Dedicated Support",
      "SLA",
      "Contact Sales",
    ],
  },
};

export const PLAN_ORDER: PlanId[] = [
  "free",
  "starter",
  "professional",
  "enterprise",
];

export type PlanComparisonValue = string | boolean;

export type PlanComparisonRow = {
  label: string;
  values: Record<PlanId, PlanComparisonValue>;
};

function comparisonValues(
  map: (plan: PlanDefinition) => PlanComparisonValue
): Record<PlanId, PlanComparisonValue> {
  return {
    free: map(PLANS.free),
    starter: map(PLANS.starter),
    professional: map(PLANS.professional),
    enterprise: map(PLANS.enterprise),
  };
}

function limitLabel(limit: number | null): string {
  return formatLimitValue(limit);
}

export function getPlanComparisonRows(): PlanComparisonRow[] {
  return [
    {
      label: "Churches",
      values: {
        free: "1",
        starter: "1",
        professional: "5 (coming soon)",
        enterprise: "Unlimited (coming soon)",
      },
    },
    {
      label: "Members",
      values: comparisonValues((plan) => limitLabel(plan.limits.members)),
    },
    {
      label: "Songs",
      values: comparisonValues((plan) => limitLabel(plan.limits.songs)),
    },
    {
      label: "Sermons",
      values: comparisonValues((plan) => limitLabel(plan.limits.sermons)),
    },
    {
      label: "Articles",
      values: comparisonValues((plan) => limitLabel(plan.limits.articles)),
    },
    {
      label: "Shorts / Videos",
      values: comparisonValues((plan) => limitLabel(plan.limits.shorts)),
    },
    {
      label: "Events",
      values: comparisonValues((plan) => limitLabel(plan.limits.events)),
    },
    {
      label: "Prayer Requests",
      values: comparisonValues((plan) => limitLabel(plan.limits.prayerRequests)),
    },
    {
      label: "Donations",
      values: {
        free: "No",
        starter: true,
        professional: true,
        enterprise: true,
      },
    },
    {
      label: "Shepherd AI",
      values: {
        free: `${SHEPHERD_TRIAL_DAYS} days`,
        starter: true,
        professional: true,
        enterprise: true,
      },
    },
    {
      label: "Email notifications",
      values: comparisonValues((plan) => plan.features.canUseEmailNotifications),
    },
    {
      label: "Analytics",
      values: comparisonValues((plan) => plan.features.canUseAnalytics),
    },
    {
      label: "Advanced analytics",
      values: {
        free: false,
        starter: false,
        professional: "Coming soon",
        enterprise: "Coming soon",
      },
    },
    {
      label: "Custom branding",
      values: comparisonValues((plan) => plan.features.canCustomizeBranding),
    },
    {
      label: "Event registration",
      values: {
        free: false,
        starter: false,
        professional: "Coming soon",
        enterprise: "Coming soon",
      },
    },
    {
      label: "Multiple admins",
      values: comparisonValues((plan) => plan.features.canInviteAdmins),
    },
    {
      label: "White label",
      values: {
        free: false,
        starter: false,
        professional: false,
        enterprise: "Coming soon",
      },
    },
    {
      label: "Custom domain",
      values: {
        free: false,
        starter: false,
        professional: false,
        enterprise: "Coming soon",
      },
    },
    {
      label: "API access",
      values: {
        free: false,
        starter: false,
        professional: false,
        enterprise: "Coming soon",
      },
    },
    {
      label: "Dedicated support",
      values: comparisonValues((plan) => plan.features.hasDedicatedSupport),
    },
    {
      label: "SLA",
      values: comparisonValues((plan) => plan.features.hasSla),
    },
  ];
}

export function getPlan(planId: PlanId): PlanDefinition {
  return PLANS[planId];
}

export function getNextPlan(planId: PlanId): PlanDefinition | null {
  const index = PLAN_ORDER.indexOf(planId);
  if (index < 0 || index >= PLAN_ORDER.length - 1) return null;
  return PLANS[PLAN_ORDER[index + 1]];
}

export function formatPlanPrice(
  plan: PlanDefinition,
  interval: "monthly" | "yearly"
): string {
  if (plan.contactSales) return "Custom";
  const price =
    interval === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
  if (price === null || price === undefined) return "Custom";
  if (price === 0) return `Free for ${TRIAL_DURATION_DAYS} days`;
  return interval === "yearly" ?
      `$${price}/yr`
    : `$${price}/mo`;
}

export function formatLimitValue(limit: number | null): string {
  if (limit === null) return "Unlimited";
  return limit.toLocaleString();
}
