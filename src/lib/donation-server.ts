import { triggerDonationCompletedEmails } from "./email/triggers";
import {
  completeDonationPayment as completePgDonation,
  createPendingDonation as createPgPendingDonation,
  getDonationById,
  getDonationCampaignById,
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

  const donation = await completePgDonation({
    donationId: input.donationId,
    transactionId: input.transactionId,
  });
  if (donation) {
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
