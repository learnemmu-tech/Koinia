"use server";

import { loadReadablePrayerRequest } from "@/lib/prayer/prayer-authorization";
import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";

/**
 * The only prayer read exposed as a server action. Authorization is enforced on
 * the server: anonymous callers, other churches' members, and unknown ids all
 * receive null. The former list actions (`getPrayerRequests`,
 * `getApprovedPrayerRequests`, `getLatestApprovedPrayerRequests`) were removed
 * because they accepted a client-supplied scope; server code now uses
 * `@/lib/prayer-request-queries.server` with a server-derived scope.
 */
export async function getPrayerRequestById(
  requestId: string
): Promise<FirebasePrayerRequest | null> {
  return loadReadablePrayerRequest(requestId);
}
