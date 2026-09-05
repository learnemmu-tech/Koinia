"use server";

import { listPrayerRequestsForClerkUser as listForUser } from "@/lib/postgres/features";
import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";

export async function listMyPrayerRequests(
  userId: string
): Promise<FirebasePrayerRequest[]> {
  return listForUser(userId);
}
