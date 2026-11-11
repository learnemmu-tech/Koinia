"use client";

import { useEffect, useRef } from "react";

import type { RecentlyViewedItemType } from "@/types/firebase-recently-viewed";

import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useRecentlyViewedOptional } from "@/context/recently-viewed-context";

type RecordRecentlyViewedInput = {
  itemType: RecentlyViewedItemType;
  itemId: string;
  enabled?: boolean;
};

export function useRecordRecentlyViewed({
  itemType,
  itemId,
  enabled = true,
}: RecordRecentlyViewedInput): void {
  const { user } = useFirebaseAuth();
  const viewed = useRecentlyViewedOptional();
  const recordView = viewed?.recordView;
  const recordedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !user?.uid || !recordView) return;

    const trimmedId = itemId.trim();
    if (!trimmedId) return;

    const key = `${itemType}:${trimmedId}`;
    if (recordedRef.current === key) return;
    recordedRef.current = key;

    void recordView(itemType, trimmedId);
  }, [enabled, user?.uid, itemType, itemId, recordView]);
}
