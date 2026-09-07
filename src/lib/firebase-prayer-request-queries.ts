"use server";

import {
  getPrayerRequestById as loadPrayerRequestById,
  listPrayerRequests,
} from "@/lib/postgres/features";
import { isPublicPrayerRequest } from "@/lib/prayer-request-firestore";
import type { ContentQueryInput } from "@/lib/content/content-scope";
import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";

export async function getPrayerRequests(
  scope: ContentQueryInput
): Promise<FirebasePrayerRequest[]> {
  return listPrayerRequests(scope);
}

export async function getApprovedPrayerRequests(
  scope: ContentQueryInput
): Promise<FirebasePrayerRequest[]> {
  return (await listPrayerRequests(scope)).filter(
    (request) => request.status === "approved" && isPublicPrayerRequest(request)
  );
}

export async function getLatestApprovedPrayerRequests(
  scope: ContentQueryInput,
  limit = 6
): Promise<FirebasePrayerRequest[]> {
  return (await getApprovedPrayerRequests(scope)).slice(0, limit);
}

export async function getPrayerRequestById(
  requestId: string
): Promise<FirebasePrayerRequest | null> {
  return loadPrayerRequestById(requestId);
}
