"use server";

import { listUserIntercessions } from "@/lib/postgres/features";
import { getPrayerSession } from "@/lib/prayer/prayer-authorization";
import { isSameAuthenticatedUser } from "@/lib/prayer/prayer-policy";

export async function userHasPrayedForRequest(
  requestId: string,
  userId: string
): Promise<boolean> {
  const session = await getPrayerSession();
  if (!isSameAuthenticatedUser(session?.clerkId, userId)) return false;
  const items = await listUserIntercessions(session!.clerkId);
  return items.some((item) => item.requestId === requestId);
}
