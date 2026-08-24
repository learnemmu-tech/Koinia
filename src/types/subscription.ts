/** Subscription plan identifiers — stable for future Stripe price mapping. */
export type PlanId = "free" | "starter" | "professional" | "enterprise";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete";

export type BillingInterval = "monthly" | "yearly";

/** Usage counters — cached on subscription doc, refreshed server-side. */
export type SubscriptionUsage = {
  members: number;
  songs: number;
  sermons: number;
  articles: number;
  churches: number;
  admins: number;
  events: number;
  donationCampaigns: number;
};

export type UsageLimitKey = keyof SubscriptionUsage;

/** Plan limits — `null` means unlimited. */
export type PlanLimits = Record<UsageLimitKey, number | null>;

/** Feature flags resolved from plan + optional overrides. */
export type SubscriptionFeatureFlags = {
  canCreateSongs: boolean;
  canCreateSermons: boolean;
  canCreateArticles: boolean;
  canCreateEvents: boolean;
  canCreateDonations: boolean;
  canCreateChurches: boolean;
  canUseEmailNotifications: boolean;
  canUseAnalytics: boolean;
  canUseAdvancedAnalytics: boolean;
  canCustomizeBranding: boolean;
  canUseEventRegistration: boolean;
  canInviteAdmins: boolean;
  canUseWhiteLabel: boolean;
  canUseCustomDomain: boolean;
  canUseApiAccess: boolean;
  hasPrioritySupport: boolean;
  hasDedicatedSupport: boolean;
  hasSla: boolean;
};

export type FeatureFlagKey = keyof SubscriptionFeatureFlags;

export type ChurchSubscription = {
  id: string;
  /** Organization that owns billing — primary tenant key for subscriptions. */
  organizationId: string;
  /** @deprecated Legacy per-church subscriptions — use organizationId */
  churchId?: string;
  planId: PlanId;
  status: SubscriptionStatus;
  billingInterval?: BillingInterval;
  trialStart?: number;
  trialEnd?: number;
  currentPeriodStart?: number;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd: boolean;
  /** Optional per-tenant overrides (e.g. enterprise custom deals). */
  featureFlags?: Partial<SubscriptionFeatureFlags>;
  usage?: SubscriptionUsage;
  /** Future payment integration fields */
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: number;
  updatedAt: number;
};

export type PlanDefinition = {
  id: PlanId;
  name: string;
  tagline: string;
  description: string;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  highlighted?: boolean;
  contactSales?: boolean;
  limits: PlanLimits;
  features: SubscriptionFeatureFlags;
  /** Marketing bullet list for pricing cards */
  highlights: string[];
};

export type UsageCheck = {
  key: UsageLimitKey;
  label: string;
  current: number;
  limit: number | null;
  atLimit: boolean;
  percent: number | null;
};

export type SubscriptionSnapshot = {
  subscription: ChurchSubscription;
  plan: PlanDefinition;
  features: SubscriptionFeatureFlags;
  limits: PlanLimits;
  usage: SubscriptionUsage;
  usageChecks: UsageCheck[];
};
