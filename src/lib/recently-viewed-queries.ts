"use server";

import { listRecentlyViewed } from "@/lib/postgres/features";
import type { FirebaseRecentlyViewed } from "@/types/firebase-recently-viewed";

export async function fetchUserRecentlyViewed(
  userId: string
): Promise<FirebaseRecentlyViewed[]> {
  return listRecentlyViewed(userId);
}
