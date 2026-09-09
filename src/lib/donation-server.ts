import { triggerDonationCompletedEmails } from "./email/triggers";
import {
  completeDonationPayment as completePgDonation,
  createPendingDonation as createPgPendingDonation,
  getDonationById,
  getDonationCampaignById,
  setDonationCheckoutReference,
  type PendingDonationInput,
} from "@/lib/postgres/features";
import type {
  DonationCurrency,
  FirebaseDonation,
  FirebaseDonationCampaign,
  PaymentProviderId,
} from "@/types/firebase-donation";

export type { PendingDonationInput };

export async function createPendingDonation(
  input: PendingDonationInput
): Promise<string> {
  return createPgPendingDonation(input);
}

export async function bindDonationCheckoutReference(
  donationId: string,
  checkoutReference: string
): Promise<void> {
  await setDonationCheckoutReference({ donationId, checkoutReference });
}

export async function completeDonationPayment(input: {
  donationId: string;
  campaignId: string;
  transactionId: string;
  amount: number;
  currency: DonationCurrency;
  paymentProvider: PaymentProviderId;
  status: "completed" | "failed" | "cancelled";
}): Promise<void> {
  if (input.status !== "completed") {
    return;
  }

  const existing = await getDonationById(input.donationId);
  if (!existing) {
    throw new Error("Donation not found.");
  }
  if (existing.campaignId !== input.campaignId) {
    throw new Error("Donation does not match campaign.");
  }

  // Already completed — idempotent no-op (no duplicate emails).
  if (existing.paymentStatus === "completed") {
    return;
  }

  const result = await completePgDonation({
    donationId: input.donationId,
    transactionId: input.transactionId,
  });
  if (result?.didComplete) {
    void triggerDonationCompletedEmails(input.donationId);
  }
}

export async function getDonationForSuccessPage(
  donationId: string
): Promise<{
  donation: FirebaseDonation;
  campaign: FirebaseDonationCampaign;
} | null> {
  const donation = await getDonationById(donationId);
  if (!donation) return null;
  const campaign = await getDonationCampaignById(donation.campaignId);
  if (!campaign) return null;
  return { donation, campaign };
}
