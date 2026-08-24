import { FieldValue } from "firebase-admin/firestore";

import type {
  DonationCurrency,
  FirebaseDonation,
  FirebaseDonationCampaign,
  PaymentProviderId,
} from "@/types/firebase-donation";

import {
  DONATION_CAMPAIGNS_COLLECTION,
  DONATIONS_COLLECTION,
  normalizeDonationCampaignFromFirestore,
  normalizeDonationFromFirestore,
} from "./donation-firestore";
import { triggerDonationCompletedEmails } from "./email/triggers";
import { getAdminDb } from "./firebase-admin";
import { mergeTenantFieldsIntoPayload } from "./organization/resolve-tenant-scope";

export type PendingDonationInput = {
  campaignId: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  currency: DonationCurrency;
  isAnonymous: boolean;
  paymentProvider: PaymentProviderId;
  idempotencyKey?: string;
};

export async function createPendingDonation(
  input: PendingDonationInput
): Promise<string> {
  const adminDb = getAdminDb();
  if (!adminDb) {
    throw new Error(
      "Firebase Admin is not configured. Donations require server-side setup."
    );
  }

  if (input.idempotencyKey) {
    const existing = await adminDb
      .collection(DONATIONS_COLLECTION)
      .where("idempotencyKey", "==", input.idempotencyKey)
      .limit(1)
      .get();

    if (!existing.empty) {
      return existing.docs[0]!.id;
    }
  }

  const campaignSnap = await adminDb
    .collection(DONATION_CAMPAIGNS_COLLECTION)
    .doc(input.campaignId)
    .get();

  if (!campaignSnap.exists) {
    throw new Error("Campaign not found.");
  }

  const campaign = normalizeDonationCampaignFromFirestore(
    campaignSnap.id,
    campaignSnap.data() as Record<string, unknown>
  );

  if (campaign.status !== "active") {
    throw new Error("This campaign is not accepting donations.");
  }

  if (campaign.currency !== input.currency) {
    throw new Error("Donation currency does not match campaign currency.");
  }

  const donationPayload = await mergeTenantFieldsIntoPayload(
    {
      campaignId: input.campaignId,
      donorName: input.isAnonymous ? "Anonymous" : input.donorName.trim(),
      donorEmail: input.donorEmail.trim(),
      amount: input.amount,
      currency: input.currency,
      paymentStatus: "pending",
      paymentProvider: input.paymentProvider,
      transactionId: "",
      isAnonymous: input.isAnonymous,
      idempotencyKey: input.idempotencyKey ?? null,
      churchId: campaign.churchId,
    },
    campaign.churchId
  );

  const docRef = await adminDb.collection(DONATIONS_COLLECTION).add({
    ...donationPayload,
    createdAt: FieldValue.serverTimestamp(),
  });

  return docRef.id;
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
  const adminDb = getAdminDb();
  if (!adminDb) {
    throw new Error("Firebase Admin is not configured.");
  }

  if (input.transactionId) {
    const duplicate = await adminDb
      .collection(DONATIONS_COLLECTION)
      .where("transactionId", "==", input.transactionId)
      .where("paymentStatus", "==", "completed")
      .limit(1)
      .get();

    if (!duplicate.empty) {
      return;
    }
  }

  let newlyCompleted = false;

  await adminDb.runTransaction(async (transaction) => {
    const donationRef = adminDb.collection(DONATIONS_COLLECTION).doc(input.donationId);
    const campaignRef = adminDb
      .collection(DONATION_CAMPAIGNS_COLLECTION)
      .doc(input.campaignId);

    const donationSnap = await transaction.get(donationRef);
    const campaignSnap = await transaction.get(campaignRef);

    if (!donationSnap.exists || !campaignSnap.exists) {
      throw new Error("Donation or campaign not found.");
    }

    const donation = normalizeDonationFromFirestore(
      donationSnap.id,
      donationSnap.data() as Record<string, unknown>
    );

    if (donation.paymentStatus === "completed") {
      return;
    }

    transaction.update(donationRef, {
      paymentStatus: input.status,
      transactionId: input.transactionId,
      paymentProvider: input.paymentProvider,
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (input.status === "completed") {
      if (Math.abs(donation.amount - input.amount) > 0.01) {
        throw new Error("Payment amount does not match donation record.");
      }

      const campaign = normalizeDonationCampaignFromFirestore(
        campaignSnap.id,
        campaignSnap.data() as Record<string, unknown>
      );

      transaction.update(campaignRef, {
        currentAmount: campaign.currentAmount + donation.amount,
        updatedAt: FieldValue.serverTimestamp(),
      });

      newlyCompleted = true;
    }
  });

  if (newlyCompleted) {
    void triggerDonationCompletedEmails(input.donationId);
  }
}

export async function getDonationForSuccessPage(
  donationId: string
): Promise<{
  donation: FirebaseDonation;
  campaign: FirebaseDonationCampaign;
} | null> {
  const adminDb = getAdminDb();
  if (!adminDb) return null;

  const donationSnap = await adminDb
    .collection(DONATIONS_COLLECTION)
    .doc(donationId)
    .get();

  if (!donationSnap.exists) return null;

  const donation = normalizeDonationFromFirestore(
    donationSnap.id,
    donationSnap.data() as Record<string, unknown>
  );

  const campaignSnap = await adminDb
    .collection(DONATION_CAMPAIGNS_COLLECTION)
    .doc(donation.campaignId)
    .get();

  if (!campaignSnap.exists) return null;

  return {
    donation,
    campaign: normalizeDonationCampaignFromFirestore(
      campaignSnap.id,
      campaignSnap.data() as Record<string, unknown>
    ),
  };
}
