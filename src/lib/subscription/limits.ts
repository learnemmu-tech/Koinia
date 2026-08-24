import type {
  PlanId,
  PlanLimits,
  SubscriptionUsage,
  UsageCheck,
  UsageLimitKey,
} from "@/types/subscription";

import { getPlan } from "./plans";

export const USAGE_LIMIT_LABELS: Record<UsageLimitKey, string> = {
  members: "Members",
  songs: "Songs",
  sermons: "Sermons",
  articles: "Articles",
  churches: "Churches",
  admins: "Admins",
  events: "Events",
  donationCampaigns: "Donation Campaigns",
};

export const EMPTY_USAGE: SubscriptionUsage = {
  members: 0,
  songs: 0,
  sermons: 0,
  articles: 0,
  churches: 0,
  admins: 0,
  events: 0,
  donationCampaigns: 0,
};

export function getPlanLimits(planId: PlanId): PlanLimits {
  return getPlan(planId).limits;
}

export function isUnlimited(limit: number | null): boolean {
  return limit === null;
}

export function isAtLimit(current: number, limit: number | null): boolean {
  if (limit === null) return false;
  return current >= limit;
}

export function getUsagePercent(
  current: number,
  limit: number | null
): number | null {
  if (limit === null || limit <= 0) return null;
  return Math.min(100, Math.round((current / limit) * 100));
}

export function buildUsageCheck(
  key: UsageLimitKey,
  current: number,
  limit: number | null
): UsageCheck {
  return {
    key,
    label: USAGE_LIMIT_LABELS[key],
    current,
    limit,
    atLimit: isAtLimit(current, limit),
    percent: getUsagePercent(current, limit),
  };
}

export function buildUsageChecks(
  usage: SubscriptionUsage,
  limits: PlanLimits
): UsageCheck[] {
  return (Object.keys(USAGE_LIMIT_LABELS) as UsageLimitKey[]).map((key) =>
    buildUsageCheck(key, usage[key], limits[key])
  );
}

export function getRecommendedPlanForLimit(
  currentPlanId: PlanId,
  limitKey: UsageLimitKey,
  currentUsage: number
): PlanId {
  const order: PlanId[] = ["free", "starter", "professional", "enterprise"];
  const startIndex = order.indexOf(currentPlanId);

  for (let i = startIndex + 1; i < order.length; i++) {
    const planId = order[i];
    const limit = getPlanLimits(planId)[limitKey];
    if (!isAtLimit(currentUsage, limit)) {
      return planId;
    }
  }

  return "enterprise";
}

export function getLimitExceededMessage(
  limitKey: UsageLimitKey,
  planName: string
): string {
  const label = USAGE_LIMIT_LABELS[limitKey];
  return `You have reached your ${label.toLowerCase()} limit on the ${planName} plan.`;
}
