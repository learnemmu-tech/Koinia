import type {
  PlanDefinition,
  PlanId,
  PlanLimits,
  SubscriptionFeatureFlags,
} from "@/types/subscription";

const UNLIMITED = null;

function limits(partial: Partial<PlanLimits>): PlanLimits {
  return {
    members: 50,
    songs: 20,
    sermons: 20,
    articles: 20,
    churches: 1,
    admins: 1,
    events: 5,
    donationCampaigns: 3,
    ...partial,
  };
}

const FREE_FEATURES: SubscriptionFeatureFlags = {
  canCreateSongs: true,
  canCreateSermons: true,
  canCreateArticles: true,
  canCreateEvents: true,
  canCreateDonations: true,
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
  canUseEmailNotifications: true,
  canUseAnalytics: true,
  canCustomizeBranding: true,
  canInviteAdmins: true,
  hasPrioritySupport: true,
};

const PROFESSIONAL_FEATURES: SubscriptionFeatureFlags = {
  ...STARTER_FEATURES,
  canCreateChurches: true,
  canUseAdvancedAnalytics: true,
  canUseEventRegistration: true,
};

const ENTERPRISE_FEATURES: SubscriptionFeatureFlags = {
  ...PROFESSIONAL_FEATURES,
  canUseWhiteLabel: true,
  canUseCustomDomain: true,
  canUseApiAccess: true,
  hasDedicatedSupport: true,
  hasSla: true,
};

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "Get started",
    description: "Perfect for small ministries exploring the platform.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    limits: limits({}),
    features: FREE_FEATURES,
    highlights: [
      "1 Church",
      "50 Members",
      "20 Songs",
      "20 Sermons",
      "20 Articles",
      "Basic Events",
      "Basic Donations",
      "Community Support",
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
      churches: 5,
      admins: 10,
      events: UNLIMITED,
      donationCampaigns: UNLIMITED,
    }),
    features: PROFESSIONAL_FEATURES,
    highlights: [
      "5 Churches",
      "Unlimited Members",
      "Unlimited Songs",
      "Unlimited Sermons",
      "Unlimited Articles",
      "Advanced Analytics",
      "Event Registration",
      "Multiple Admins",
      "Priority Support",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    tagline: "At scale",
    description: "Custom solutions for large organizations and networks.",
    monthlyPrice: null,
    yearlyPrice: null,
    contactSales: true,
    limits: limits({
      members: UNLIMITED,
      songs: UNLIMITED,
      sermons: UNLIMITED,
      articles: UNLIMITED,
      churches: UNLIMITED,
      admins: UNLIMITED,
      events: UNLIMITED,
      donationCampaigns: UNLIMITED,
    }),
    features: ENTERPRISE_FEATURES,
    highlights: [
      "Unlimited Churches",
      "Unlimited Members",
      "White Label",
      "Custom Domain",
      "API Access",
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
  if (price === 0) return "Free";
  return interval === "yearly" ?
      `$${price}/yr`
    : `$${price}/mo`;
}

export function formatLimitValue(limit: number | null): string {
  if (limit === null) return "Unlimited";
  return limit.toLocaleString();
}
