"use server";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import type { FirebaseDonation, FirebaseDonationCampaign } from "@/types/firebase-donation";

import {
  DONATION_CAMPAIGNS_COLLECTION,
  DONATIONS_COLLECTION,
  filterActiveCampaigns,
  normalizeDonationCampaignFromFirestore,
  normalizeDonationFromFirestore,
} from "./donation-firestore";
import type { TenantScope } from "./organization/tenant-scope";
import { fetchTenantCollection } from "./tenant-content-server";
import { filterRecordsByChurch } from "./church-scope";
import { getAdminDb } from "./firebase-admin";
import { db } from "./firebase";
import { isRecoverableAdminError, wrapFirebaseError } from "./firebase-utils";

async function fetchCampaignsAdmin(): Promise<FirebaseDonationCampaign[]> {
  const adminDb = getAdminDb();
  if (!adminDb) return [];

  try {
    const snapshot = await adminDb
      .collection(DONATION_CAMPAIGNS_COLLECTION)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((docSnap) =>
      normalizeDonationCampaignFromFirestore(
        docSnap.id,
        docSnap.data() as Record<string, unknown>
      )
    );
  } catch {
    const snapshot = await adminDb.collection(DONATION_CAMPAIGNS_COLLECTION).get();
    return snapshot.docs
      .map((docSnap) =>
        normalizeDonationCampaignFromFirestore(
          docSnap.id,
          docSnap.data() as Record<string, unknown>
        )
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  }
}

async function fetchCampaignsClient(): Promise<FirebaseDonationCampaign[]> {
  try {
    const campaignsQuery = query(
      collection(db, DONATION_CAMPAIGNS_COLLECTION),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(campaignsQuery);
    return snapshot.docs.map((docSnap) =>
      normalizeDonationCampaignFromFirestore(
        docSnap.id,
        docSnap.data() as Record<string, unknown>
      )
    );
  } catch {
    const snapshot = await getDocs(collection(db, DONATION_CAMPAIGNS_COLLECTION));
    return snapshot.docs
      .map((docSnap) =>
        normalizeDonationCampaignFromFirestore(
          docSnap.id,
          docSnap.data() as Record<string, unknown>
        )
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  }
}

async function fetchAllCampaigns(): Promise<FirebaseDonationCampaign[]> {
  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      return await fetchCampaignsAdmin();
    } catch (error) {
      if (!isRecoverableAdminError(error)) {
        wrapFirebaseError(error);
      }
      console.warn("[Firebase] Admin SDK unavailable, using client SDK:", error);
    }
  }

  try {
    return await fetchCampaignsClient();
  } catch (error) {
    wrapFirebaseError(error);
  }
}

async function fetchActiveCampaignsAdmin(): Promise<FirebaseDonationCampaign[]> {
  const adminDb = getAdminDb();
  if (!adminDb) return [];

  try {
    const snapshot = await adminDb
      .collection(DONATION_CAMPAIGNS_COLLECTION)
      .where("status", "==", "active")
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((docSnap) =>
      normalizeDonationCampaignFromFirestore(
        docSnap.id,
        docSnap.data() as Record<string, unknown>
      )
    );
  } catch {
    const snapshot = await adminDb
      .collection(DONATION_CAMPAIGNS_COLLECTION)
      .where("status", "==", "active")
      .get();

    return snapshot.docs
      .map((docSnap) =>
        normalizeDonationCampaignFromFirestore(
          docSnap.id,
          docSnap.data() as Record<string, unknown>
        )
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  }
}

async function fetchActiveCampaignsClient(): Promise<FirebaseDonationCampaign[]> {
  try {
    const campaignsQuery = query(
      collection(db, DONATION_CAMPAIGNS_COLLECTION),
      where("status", "==", "active"),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(campaignsQuery);
    return snapshot.docs.map((docSnap) =>
      normalizeDonationCampaignFromFirestore(
        docSnap.id,
        docSnap.data() as Record<string, unknown>
      )
    );
  } catch {
    const snapshot = await getDocs(
      query(
        collection(db, DONATION_CAMPAIGNS_COLLECTION),
        where("status", "==", "active")
      )
    );
    return snapshot.docs
      .map((docSnap) =>
        normalizeDonationCampaignFromFirestore(
          docSnap.id,
          docSnap.data() as Record<string, unknown>
        )
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  }
}

async function fetchActiveCampaigns(): Promise<FirebaseDonationCampaign[]> {
  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      return await fetchActiveCampaignsAdmin();
    } catch (error) {
      if (!isRecoverableAdminError(error)) {
        wrapFirebaseError(error);
      }
      console.warn("[Firebase] Admin SDK unavailable, using client SDK:", error);
    }
  }

  try {
    return await fetchActiveCampaignsClient();
  } catch (error) {
    wrapFirebaseError(error);
  }
}

export async function getDonationCampaigns(
  scope: TenantScope
): Promise<FirebaseDonationCampaign[]> {
  return fetchTenantCollection(
    DONATION_CAMPAIGNS_COLLECTION,
    scope,
    (id, data) => normalizeDonationCampaignFromFirestore(id, data),
    { orderField: "createdAt", defaultBranchId: scope.branchId ?? null }
  );
}

export async function getActiveDonationCampaigns(
  scope: TenantScope
): Promise<FirebaseDonationCampaign[]> {
  return filterActiveCampaigns(await getDonationCampaigns(scope));
}

export async function getDonationCampaignById(
  campaignId: string
): Promise<FirebaseDonationCampaign | null> {
  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      const snapshot = await adminDb
        .collection(DONATION_CAMPAIGNS_COLLECTION)
        .doc(campaignId)
        .get();

      if (snapshot.exists) {
        return normalizeDonationCampaignFromFirestore(
          snapshot.id,
          snapshot.data() as Record<string, unknown>
        );
      }
    } catch (error) {
      if (!isRecoverableAdminError(error)) {
        wrapFirebaseError(error);
      }
      console.warn("[Firebase] Admin SDK unavailable, using client SDK:", error);
    }
  }

  try {
    const snapshot = await getDoc(
      doc(db, DONATION_CAMPAIGNS_COLLECTION, campaignId)
    );
    if (!snapshot.exists()) return null;

    return normalizeDonationCampaignFromFirestore(
      snapshot.id,
      snapshot.data() as Record<string, unknown>
    );
  } catch (error) {
    wrapFirebaseError(error);
  }
}

export async function getRecentDonations(
  limit = 10
): Promise<FirebaseDonation[]> {
  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      const snapshot = await adminDb
        .collection(DONATIONS_COLLECTION)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      return snapshot.docs.map((docSnap) =>
        normalizeDonationFromFirestore(
          docSnap.id,
          docSnap.data() as Record<string, unknown>
        )
      );
    } catch (error) {
      if (!isRecoverableAdminError(error)) {
        wrapFirebaseError(error);
      }
    }
  }

  return [];
}

export async function getCompletedDonationStats(): Promise<{
  totalDonations: number;
  amountRaised: number;
}> {
  const adminDb = getAdminDb();
  if (!adminDb) {
    return { totalDonations: 0, amountRaised: 0 };
  }

  try {
    const snapshot = await adminDb
      .collection(DONATIONS_COLLECTION)
      .where("paymentStatus", "==", "completed")
      .get();

    let amountRaised = 0;
    for (const docSnap of snapshot.docs) {
      const donation = normalizeDonationFromFirestore(
        docSnap.id,
        docSnap.data() as Record<string, unknown>
      );
      amountRaised += donation.amount;
    }

    return {
      totalDonations: snapshot.size,
      amountRaised,
    };
  } catch {
    return { totalDonations: 0, amountRaised: 0 };
  }
}

export async function getDonationById(
  donationId: string
): Promise<FirebaseDonation | null> {
  const adminDb = getAdminDb();
  if (!adminDb) return null;

  try {
    const snapshot = await adminDb
      .collection(DONATIONS_COLLECTION)
      .doc(donationId)
      .get();

    if (!snapshot.exists) return null;

    return normalizeDonationFromFirestore(
      snapshot.id,
      snapshot.data() as Record<string, unknown>
    );
  } catch {
    return null;
  }
}
