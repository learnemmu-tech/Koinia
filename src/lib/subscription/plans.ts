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
    books: 0,
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
  hasPrioritySupport: false,
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
  hasDedicatedSupport: false,
  hasSla: false,
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
    limits: limits({
      songs: 5,
      sermons: 5,
      articles: 5,
      shorts: 3,
      books: 3,
      donationCampaigns: 0,
      prayerRequests: 5,
    }),
    features: FREE_FEATURES,
    highlights: [
      "1 Church",
      "Up to 15 members",
      "Limited content access",
      `Shepherd AI for ${SHEPHERD_TRIAL_DAYS} days`,
      "Donations not included",
    ],
  },
  starter: {
    id: "starter",
    name: "Starter",
    tagline: "Small and growing churches",
    description: "For churches ready to scale worship content and engagement.",
    monthlyPrice: 1499,
    yearlyPrice: 14990,
    limits: limits({
      members: 300,
      songs: UNLIMITED,
      sermons: UNLIMITED,
      articles: UNLIMITED,
      events: UNLIMITED,
      donationCampaigns: UNLIMITED,
      books: UNLIMITED,
      shorts: UNLIMITED,
      prayerRequests: UNLIMITED,
      admins: 2,
    }),
    features: STARTER_FEATURES,
    highlights: [
      "1 Church",
      "Up to 300 members",
      "Heritage and Signature templates",
      "Unlimited songs, sermons, and articles",
      "Donations, events, and community features",
      "Shepherd AI — limited monthly usage",
    ],
  },
  professional: {
    id: "professional",
    name: "Pro",
    tagline: "Larger congregations",
    description: "For a single church with a larger membership and more admins.",
    monthlyPrice: 2499,
    yearlyPrice: 24990,
    highlighted: true,
    limits: limits({
      members: 1000,
      songs: UNLIMITED,
      sermons: UNLIMITED,
      articles: UNLIMITED,
      churches: 1,
      admins: 5,
      events: UNLIMITED,
      donationCampaigns: UNLIMITED,
      books: UNLIMITED,
      shorts: UNLIMITED,
      prayerRequests: UNLIMITED,
    }),
    features: PROFESSIONAL_FEATURES,
    highlights: [
      "1 Church",
      "Up to 1,000 members",
      "Heritage and Signature templates",
      "Unlimited songs, sermons, and articles",
      "Donations, events, and community features",
      "Shepherd AI — higher monthly usage than Starter",
      "Advanced analytics",
      "Up to 5 admin seats",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Large church networks",
    description: "Custom plans for large organizations. Not available for purchase yet.",
    monthlyPrice: null,
    yearlyPrice: null,
    contactSales: true,
    comingSoon: true,
    limits: limits({
      members: UNLIMITED,
      songs: UNLIMITED,
      sermons: UNLIMITED,
      articles: UNLIMITED,
      churches: 1,
      admins: UNLIMITED,
      events: UNLIMITED,
      donationCampaigns: UNLIMITED,
      books: UNLIMITED,
      shorts: UNLIMITED,
      prayerRequests: UNLIMITED,
    }),
    features: ENTERPRISE_FEATURES,
    highlights: [
      "Custom church and member capacity",
      "All Pro+ features",
      "Custom integrations and API access",
      "Dedicated support and SLA",
    ],
  },
};

/** Display-only. Not a stored plan id and not available for checkout. */
export const PRO_PLUS_DISPLAY = {
  id: "pro_plus" as const,
  name: "Pro+",
  tagline: "Multi-church organizations",
  description: "Planned for larger organizations. Not available for purchase yet.",
  monthlyPrice: 3999,
  yearlyPrice: 39990,
  comingSoon: true as const,
  highlighted: false,
  contactSales: false,
  highlights: [
    "Up to 5 churches — coming soon",
    "Higher member capacity — coming soon",
    "All Pro features",
    "Event registration — included in Pro+",
    "Advanced analytics",
    "Own domain and white-label",
    "Unlimited Shepherd AI",
  ],
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
  values: Record<PlanId | "pro_plus", PlanComparisonValue>;
};

function comparisonValues(
  map: (plan: PlanDefinition) => PlanComparisonValue
): Record<PlanId | "pro_plus", PlanComparisonValue> {
  return {
    free: map(PLANS.free),
    starter: map(PLANS.starter),
    professional: map(PLANS.professional),
    pro_plus: "Coming soon",
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
        professional: "1",
        pro_plus: "Up to 5 churches — coming soon",
        enterprise: "Custom — coming soon",
      },
    },
    {
      label: "Members",
      values: {
        free: "Up to 15 members",
        starter: "Up to 300 members",
        professional: "Up to 1,000 members",
        pro_plus: "Up to 3,000 members — coming soon",
        enterprise: "Custom — coming soon",
      },
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
      values: {
        free: "1",
        starter: "Unlimited basic events",
        professional: "Unlimited basic events",
        pro_plus: "Coming soon",
        enterprise: "Coming soon",
      },
    },
    {
      label: "Prayer Requests",
      values: comparisonValues((plan) => limitLabel(plan.limits.prayerRequests)),
    },
    {
      label: "Books",
      values: comparisonValues((plan) =>
        plan.limits.books === 0 ? "Not included" : limitLabel(plan.limits.books)
      ),
    },
    {
      label: "Heritage template",
      values: {
        free: "Included",
        starter: "Included",
        professional: "Included",
        pro_plus: "Coming soon",
        enterprise: "Coming soon",
      },
    },
    {
      label: "Signature template",
      values: {
        free: "Included",
        starter: "Included",
        professional: "Included",
        pro_plus: "Coming soon",
        enterprise: "Coming soon",
      },
    },
    {
      label: "Donations",
      values: {
        free: "Not included",
        starter: "Included",
        professional: "Included",
        pro_plus: "Coming soon",
        enterprise: "Coming soon",
      },
    },
    {
      label: "Direct chat and group chat",
      values: {
        free: "Not included",
        starter: "Included",
        professional: "Included",
        pro_plus: "Coming soon",
        enterprise: "Coming soon",
      },
    },
    {
      label: "Shepherd AI",
      values: {
        free: `${SHEPHERD_TRIAL_DAYS} days`,
        starter: "Limited monthly usage",
        professional: "Higher monthly usage than Starter",
        pro_plus: "Unlimited",
        enterprise: "Coming soon",
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
        professional: "Included",
        pro_plus: "Included",
        enterprise: "Coming soon",
      },
    },
    {
      label: "Church subdomain",
      values: {
        free: "Included",
        starter: "Included",
        professional: "Included",
        pro_plus: "Coming soon",
        enterprise: "Coming soon",
      },
    },
    {
      label: "Admin seats",
      values: {
        free: "1",
        starter: "2",
        professional: "Up to 5",
        pro_plus: "Coming soon",
        enterprise: "Custom — coming soon",
      },
    },
    {
      label: "Support",
      values: {
        free: "Standard",
        starter: "Standard",
        professional: "Standard",
        pro_plus: "Coming soon",
        enterprise: "Dedicated support — coming soon",
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
        professional: "Not included",
        pro_plus: "Included",
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
        professional: "Not included",
        pro_plus: "Included",
        enterprise: "Coming soon",
      },
    },
    {
      label: "Custom domain",
      values: {
        free: "Not included",
        starter: "Not included",
        professional: "Not included",
        pro_plus: "Included",
        enterprise: "Coming soon",
      },
    },
    {
      label: "API access",
      values: {
        free: "Not included",
        starter: "Not included",
        professional: "Not included",
        pro_plus: "Coming soon",
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

/** Paid plans an administrator can choose during onboarding. Excludes trial-only, contact-sales, and coming-soon plans. */
export function getPurchasablePlans(): PlanDefinition[] {
  return PLAN_ORDER.map((id) => PLANS[id]).filter(
    (plan) =>
      !plan.comingSoon &&
      !plan.contactSales &&
      plan.monthlyPrice != null &&
      plan.monthlyPrice > 0 &&
      plan.yearlyPrice != null &&
      plan.yearlyPrice > 0
  );
}

export function isPurchasablePlan(planId: string): planId is PlanId {
  return getPurchasablePlans().some((plan) => plan.id === planId);
}

export function getPlan(planId: PlanId): PlanDefinition {
  return PLANS[planId];
}

export function getNextPlan(planId: PlanId): PlanDefinition | null {
  const index = PLAN_ORDER.indexOf(planId);
  if (index < 0 || index >= PLAN_ORDER.length - 1) return null;
  return PLANS[PLAN_ORDER[index + 1]];
}

export const PRICING_TABLE_COLUMNS = [
  "free",
  "starter",
  "professional",
  "pro_plus",
  "enterprise",
] as const;

/** Shared whole-percent annual savings when every plan uses the same rate. */
export function sharedAnnualSavingsPercent(
  plans: Pick<PlanDefinition, "monthlyPrice" | "yearlyPrice">[]
): number | null {
  const rates = plans.map((plan) => {
    if (!plan.monthlyPrice || !plan.yearlyPrice) return null;
    const fullYear = plan.monthlyPrice * 12;
    if (fullYear <= plan.yearlyPrice) return null;
    return Math.round((1 - plan.yearlyPrice / fullYear) * 100);
  });
  const first = rates[0];
  if (first == null || rates.some((rate) => rate !== first)) return null;
  return first;
}

export function formatPlanPrice(
  plan: Pick<PlanDefinition, "contactSales" | "monthlyPrice" | "yearlyPrice">,
  interval: "monthly" | "yearly"
): string {
  if (plan.contactSales) return "Custom";
  const price =
    interval === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
  if (price === null || price === undefined) return "Custom";
  if (price === 0) return `Free for ${TRIAL_DURATION_DAYS} days`;
  const amount = price.toLocaleString("en-IN");
  return interval === "yearly" ? `₹${amount}/yr` : `₹${amount}/mo`;
}

export function formatLimitValue(limit: number | null): string {
  if (limit === null) return "Unlimited";
  return limit.toLocaleString();
}
