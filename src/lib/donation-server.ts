import { fetchRazorpayPayment } from "@/lib/payments/razorpay-subscriptions";
import { triggerDonationCompletedEmails } from "./email/triggers";
import {
  completeDonationPayment as completePgDonation,
  createPendingDonation as createPgPendingDonation,
  getDonationById,
  getDonationCampaignById,
  setDonationCheckoutReference,
  type PendingDonationInput,
  type PendingDonationResult,
} from "@/lib/postgres/features";
import type {
  DonationCurrency,
  FirebaseDonation,
  FirebaseDonationCampaign,
  PaymentProviderId,
} from "@/types/firebase-donation";

export type { PendingDonationInput, PendingDonationResult };

export async function createPendingDonation(
  input: PendingDonationInput
): Promise<PendingDonationResult> {
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

  if (input.paymentProvider === "razorpay") {
    const payment = await fetchRazorpayPayment(input.transactionId);
    if (payment.status !== "captured") {
      throw new Error("Payment is not captured.");
    }
    if (!payment.order_id || payment.order_id !== existing.transactionId) {
      throw new Error("Payment does not match the donation order.");
    }
    const expectedPaise = Math.round(Number(existing.amount) * 100);
    if (payment.amount !== expectedPaise) {
      throw new Error("Payment amount does not match.");
    }
    if (payment.currency.toUpperCase() !== existing.currency.toUpperCase()) {
      throw new Error("Payment currency does not match.");
    }
  } else if (Number(existing.amount) !== input.amount || existing.currency !== input.currency) {
    throw new Error("Payment amount does not match.");
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
