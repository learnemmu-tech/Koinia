import "server-only";

import { listPrayerRequests } from "@/lib/postgres/features";
import type { ContentQueryInput } from "@/lib/content/content-scope";
import { isPublicPrayerRequest } from "@/lib/prayer-request-firestore";
import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";

/**
 * Server-internal, NOT a server action. The caller must derive `scope` from the
 * authenticated session / verified route church, never from client input.
 */
export async function listApprovedPrayerRequests(
  scope: ContentQueryInput
): Promise<FirebasePrayerRequest[]> {
  return (await listPrayerRequests(scope)).filter(
    (request) => request.status === "approved" && isPublicPrayerRequest(request)
  );
}

export async function listLatestApprovedPrayerRequests(
  scope: ContentQueryInput,
  limit = 6
): Promise<FirebasePrayerRequest[]> {
  return (await listApprovedPrayerRequests(scope)).slice(0, limit);
}
