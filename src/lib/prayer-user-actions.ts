"use server";

import { listPrayerRequestsForClerkUser as listForUser } from "@/lib/postgres/features";
import { getPrayerSession } from "@/lib/prayer/prayer-authorization";
import { isSameAuthenticatedUser } from "@/lib/prayer/prayer-policy";
import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";

/** A user may list only their own requests; the id is verified against the session. */
export async function listMyPrayerRequests(
  userId: string
): Promise<FirebasePrayerRequest[]> {
  const session = await getPrayerSession();
  if (!isSameAuthenticatedUser(session?.clerkId, userId)) return [];
  return listForUser(session!.clerkId);
}
