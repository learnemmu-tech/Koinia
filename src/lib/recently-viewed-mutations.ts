"use server";

import {
  clearRecentlyViewedHistory as clearHistory,
  recordRecentlyViewed as saveRecentlyViewed,
} from "@/lib/postgres/features";
import type { RecentlyViewedItemType } from "@/types/firebase-recently-viewed";

export async function recordRecentlyViewed(
  userId: string,
  itemType: RecentlyViewedItemType,
  itemId: string
): Promise<void> {
  const trimmedId = itemId.trim();
  if (!trimmedId) return;
  await saveRecentlyViewed(userId, itemType, trimmedId);
}

export const trackRecentlyViewedItem = recordRecentlyViewed;

export async function clearRecentlyViewedHistory(userId: string): Promise<void> {
  await clearHistory(userId);
}
