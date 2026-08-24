"use client";

import type { RecentlyViewedItemType } from "@/types/firebase-recently-viewed";

import { useRecordRecentlyViewed } from "@/hooks/use-record-recently-viewed";

type RecordRecentlyViewedProps = {
  itemType: RecentlyViewedItemType;
  itemId: string;
};

export function RecordRecentlyViewed({
  itemType,
  itemId,
}: RecordRecentlyViewedProps) {
  useRecordRecentlyViewed({ itemType, itemId });
  return null;
}
