import type {
  CreateDonationCampaignInput,
  DonationCampaignStatus,
  DonationCurrency,
  FirebaseDonation,
  FirebaseDonationCampaign,
  PaymentProviderId,
  PaymentStatus,
} from "@/types/firebase-donation";
import { DONATION_CURRENCIES } from "@/types/firebase-donation";

import { resolveDocumentChurchId } from "./church-scope";
import { toMillis } from "./firebase-utils";

export const DONATION_CAMPAIGNS_COLLECTION = "donationCampaigns";
export const DONATIONS_COLLECTION = "donations";

const CURRENCY_SET = new Set<string>(DONATION_CURRENCIES);

export function normalizeDonationCurrency(value: unknown): DonationCurrency {
  const raw = String(value ?? "").trim().toUpperCase();
  if (CURRENCY_SET.has(raw)) {
    return raw as DonationCurrency;
  }
  return "INR";
}

export function normalizeDonationCampaignStatus(
  value: unknown
): DonationCampaignStatus {
  return value === "active" ? "active" : "inactive";
}

export function normalizePaymentStatus(value: unknown): PaymentStatus {
  const raw = String(value ?? "").trim();
  if (
    raw === "completed" ||
    raw === "failed" ||
    raw === "cancelled" ||
    raw === "pending"
  ) {
    return raw;
  }
  return "pending";
}

export function normalizePaymentProvider(value: unknown): PaymentProviderId {
  return value === "razorpay" ? "razorpay" : "stripe";
}

export function normalizeDonationCampaignFromFirestore(
  id: string,
  data: Record<string, unknown>
): FirebaseDonationCampaign {
  return {
    id,
    churchId: resolveDocumentChurchId(data),
    organizationId: String(data.organizationId ?? "").trim() || undefined,
    branchId: String(data.branchId ?? "").trim() || null,
    title: String(data.title ?? "").trim(),
    description: String(data.description ?? "").trim(),
    bannerImage: String(data.bannerImage ?? "").trim() || undefined,
    targetAmount: normalizeAmount(data.targetAmount),
    currentAmount: normalizeAmount(data.currentAmount),
    currency: normalizeDonationCurrency(data.currency),
    status: normalizeDonationCampaignStatus(data.status),
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt ?? data.createdAt),
  };
}

export function normalizeDonationFromFirestore(
  id: string,
  data: Record<string, unknown>
): FirebaseDonation {
  return {
    id,
    churchId: resolveDocumentChurchId(data),
    organizationId: String(data.organizationId ?? "").trim() || undefined,
    branchId: String(data.branchId ?? "").trim() || null,
    campaignId: String(data.campaignId ?? "").trim(),
    donorName: String(data.donorName ?? "").trim(),
    donorEmail: String(data.donorEmail ?? "").trim(),
    amount: normalizeAmount(data.amount),
    currency: normalizeDonationCurrency(data.currency),
    paymentStatus: normalizePaymentStatus(data.paymentStatus),
    paymentProvider: normalizePaymentProvider(data.paymentProvider),
    transactionId: String(data.transactionId ?? "").trim(),
    isAnonymous: data.isAnonymous === true,
    createdAt: toMillis(data.createdAt),
  };
}

export function buildDonationCampaignCreatePayload(
  input: CreateDonationCampaignInput
) {
  return {
    churchId: input.churchId.trim(),
    title: input.title.trim(),
    description: input.description.trim(),
    bannerImage: input.bannerImage?.trim() || "",
    targetAmount: input.targetAmount,
    currentAmount: 0,
    currency: input.currency,
    status: input.status,
  };
}

export function filterActiveCampaigns(
  campaigns: FirebaseDonationCampaign[]
): FirebaseDonationCampaign[] {
  return campaigns.filter((campaign) => campaign.status === "active");
}

export function splitCampaignsByCompletion(
  campaigns: FirebaseDonationCampaign[]
): {
  active: FirebaseDonationCampaign[];
  completed: FirebaseDonationCampaign[];
} {
  const active: FirebaseDonationCampaign[] = [];
  const completed: FirebaseDonationCampaign[] = [];

  for (const campaign of filterActiveCampaigns(campaigns)) {
    if (getCampaignProgressPercent(campaign) >= 100) {
      completed.push(campaign);
    } else {
      active.push(campaign);
    }
  }

  return { active, completed };
}

export function getCampaignProgressPercent(
  campaign: Pick<FirebaseDonationCampaign, "targetAmount" | "currentAmount">
): number {
  if (campaign.targetAmount <= 0) return 0;
  return Math.min(
    100,
    Math.round((campaign.currentAmount / campaign.targetAmount) * 100)
  );
}

export function formatDonationAmount(
  amount: number,
  currency: DonationCurrency
): string {
  const locale = currency === "INR" ? "en-IN" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "INR" ? 0 : 2,
  }).format(amount);
}

function normalizeAmount(value: unknown): number {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return amount;
}
