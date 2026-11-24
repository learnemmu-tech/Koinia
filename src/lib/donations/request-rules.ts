export const DONATION_REQUEST_CATEGORIES = [
  "medical_assistance",
  "education",
  "family_emergency",
  "financial_difficulty",
  "community_support",
  "other",
] as const;

export type DonationRequestCategory = (typeof DONATION_REQUEST_CATEGORIES)[number];

export const DONATION_REQUEST_STATUSES = [
  "submitted",
  "under_review",
  "approved",
  "rejected",
] as const;

export type DonationRequestStatus = (typeof DONATION_REQUEST_STATUSES)[number];

const TRANSITIONS: Record<DonationRequestStatus, DonationRequestStatus[]> = {
  submitted: ["under_review", "approved", "rejected"],
  under_review: ["approved", "rejected"],
  approved: [],
  rejected: [],
};

export function isDonationRequestCategory(value: string): value is DonationRequestCategory {
  return (DONATION_REQUEST_CATEGORIES as readonly string[]).includes(value);
}

export function canTransitionDonationRequest(
  from: DonationRequestStatus,
  to: DonationRequestStatus
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function parseRequestedAmount(raw: string): { ok: true; amount: string } | { ok: false; error: string } {
  const value = raw.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(value)) {
    return { ok: false, error: "Enter a positive amount with up to two decimal places." };
  }
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0 || number > 100000000) {
    return { ok: false, error: "Amount is outside the allowed range." };
  }
  return { ok: true, amount: number.toFixed(2) };
}

/** Approval never creates a campaign. This flag documents that rule for tests. */
export function approvalCreatesCampaign(): false {
  return false;
}
