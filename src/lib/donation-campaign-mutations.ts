import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

import type {
  CreateDonationCampaignInput,
  DonationCampaignStatus,
  UpdateDonationCampaignInput,
} from "@/types/firebase-donation";

import {
  buildDonationCampaignCreatePayload,
  DONATION_CAMPAIGNS_COLLECTION,
} from "./donation-firestore";
import { db } from "./firebase";
import { mergeClientTenantFields } from "./organization/tenant-scope";
import { wrapFirebaseError } from "./firebase-utils";

/**
 * Client-side Firestore writes — must run in the browser with Firebase Auth
 * so security rules see request.auth (server actions do not attach auth).
 */
export async function createDonationCampaign(
  input: CreateDonationCampaignInput & {
    organizationId?: string;
    branchId?: string;
  }
): Promise<string> {
  const basePayload = buildDonationCampaignCreatePayload(input);
  const payload = mergeClientTenantFields(basePayload, {
    organizationId: input.organizationId,
    churchId: input.churchId,
    branchId: input.branchId,
  });
  const now = Timestamp.now();

  try {
    const docRef = await addDoc(
      collection(db, DONATION_CAMPAIGNS_COLLECTION),
      {
        ...payload,
        createdAt: now,
        updatedAt: now,
      }
    );
    return docRef.id;
  } catch (error) {
    wrapFirebaseError(error);
  }
}

export async function updateDonationCampaign(
  campaignId: string,
  updates: UpdateDonationCampaignInput
): Promise<void> {
  try {
    await updateDoc(doc(db, DONATION_CAMPAIGNS_COLLECTION, campaignId), {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    wrapFirebaseError(error);
  }
}

export async function setDonationCampaignStatus(
  campaignId: string,
  status: DonationCampaignStatus
): Promise<void> {
  return updateDonationCampaign(campaignId, { status });
}

export async function deleteDonationCampaign(campaignId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, DONATION_CAMPAIGNS_COLLECTION, campaignId));
  } catch (error) {
    wrapFirebaseError(error);
  }
}
