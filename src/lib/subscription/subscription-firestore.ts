import type {
  BillingInterval,
  ChurchSubscription,
  PlanId,
  SubscriptionStatus,
  SubscriptionUsage,
} from "@/types/subscription";

import { toMillis } from "@/lib/firebase-utils";

export const SUBSCRIPTIONS_COLLECTION = "subscriptions";

const VALID_PLAN_IDS: PlanId[] = [
  "free",
  "starter",
  "professional",
  "enterprise",
];

const VALID_STATUSES: SubscriptionStatus[] = [
  "active",
  "trialing",
  "past_due",
  "canceled",
  "incomplete",
];

function normalizePlanId(value: unknown): PlanId {
  const id = String(value ?? "free").trim().toLowerCase();
  if (VALID_PLAN_IDS.includes(id as PlanId)) {
    return id as PlanId;
  }
  return "free";
}

function normalizeStatus(value: unknown): SubscriptionStatus {
  const status = String(value ?? "active").trim().toLowerCase();
  if (VALID_STATUSES.includes(status as SubscriptionStatus)) {
    return status as SubscriptionStatus;
  }
  return "active";
}

function normalizeUsage(data: unknown): SubscriptionUsage | undefined {
  if (!data || typeof data !== "object") return undefined;
  const raw = data as Record<string, unknown>;
  return {
    members: Number(raw.members ?? 0) || 0,
    songs: Number(raw.songs ?? 0) || 0,
    sermons: Number(raw.sermons ?? 0) || 0,
    articles: Number(raw.articles ?? 0) || 0,
    churches: Number(raw.churches ?? 0) || 0,
    admins: Number(raw.admins ?? 0) || 0,
    events: Number(raw.events ?? 0) || 0,
    donationCampaigns: Number(raw.donationCampaigns ?? 0) || 0,
  };
}

export function normalizeSubscriptionFromFirestore(
  id: string,
  data: Record<string, unknown>
): ChurchSubscription {
  const interval = String(data.billingInterval ?? "").trim().toLowerCase();
  const organizationId = String(
    data.organizationId ?? data.churchId ?? id
  ).trim();
  const legacyChurchId = String(data.churchId ?? "").trim();

  return {
    id,
    organizationId,
    churchId: legacyChurchId && legacyChurchId !== organizationId
      ? legacyChurchId
      : undefined,
    planId: normalizePlanId(data.planId),
    status: normalizeStatus(data.status),
    billingInterval:
      interval === "yearly" || interval === "monthly" ?
        (interval as BillingInterval)
      : undefined,
    trialStart:
      data.trialStart != null ? toMillis(data.trialStart) : undefined,
    trialEnd: data.trialEnd != null ? toMillis(data.trialEnd) : undefined,
    currentPeriodStart:
      data.currentPeriodStart != null ?
        toMillis(data.currentPeriodStart)
      : undefined,
    currentPeriodEnd:
      data.currentPeriodEnd != null ?
        toMillis(data.currentPeriodEnd)
      : undefined,
    cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
    featureFlags:
      data.featureFlags && typeof data.featureFlags === "object" ?
        (data.featureFlags as ChurchSubscription["featureFlags"])
      : undefined,
    usage: normalizeUsage(data.usage),
    stripeCustomerId:
      data.stripeCustomerId != null ?
        String(data.stripeCustomerId)
      : undefined,
    stripeSubscriptionId:
      data.stripeSubscriptionId != null ?
        String(data.stripeSubscriptionId)
      : undefined,
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt ?? data.createdAt),
  };
}

export function buildDefaultSubscription(
  organizationId: string
): ChurchSubscription {
  const now = Date.now();
  return {
    id: organizationId,
    organizationId,
    planId: "free",
    status: "active",
    cancelAtPeriodEnd: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function buildSubscriptionCreatePayload(
  organizationId: string,
  planId: PlanId = "free"
): Record<string, unknown> {
  const now = Date.now();
  return {
    organizationId,
    planId,
    status: "active",
    cancelAtPeriodEnd: false,
    createdAt: now,
    updatedAt: now,
  };
}
