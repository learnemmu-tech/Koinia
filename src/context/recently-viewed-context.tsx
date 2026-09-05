"use client";

import React from "react";

import type {
  FirebaseRecentlyViewed,
  RecentlyViewedItemType,
} from "@/types/firebase-recently-viewed";

import { useFirebaseAuth } from "@/context/firebase-auth-context";
import {
  clearRecentlyViewedHistory,
  recordRecentlyViewed,
} from "@/lib/recently-viewed-mutations";
import { fetchUserRecentlyViewed } from "@/lib/recently-viewed-queries";

type RecentlyViewedContextValue = {
  recentlyViewed: FirebaseRecentlyViewed[];
  loading: boolean;
  recordView: (itemType: RecentlyViewedItemType, itemId: string) => Promise<void>;
  clearHistory: () => Promise<void>;
};

const RecentlyViewedContext =
  React.createContext<RecentlyViewedContextValue | null>(null);

export function RecentlyViewedProvider({ children }: React.PropsWithChildren) {
  const { user } = useFirebaseAuth();
  const [recentlyViewed, setRecentlyViewed] = React.useState<
    FirebaseRecentlyViewed[]
  >([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user?.uid) {
      setRecentlyViewed([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const uid = user.uid;

    async function load() {
      try {
        const items = await fetchUserRecentlyViewed(uid);
        if (!cancelled) {
          setRecentlyViewed(items);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const recordView = React.useCallback(
    async (itemType: RecentlyViewedItemType, itemId: string) => {
      if (!user?.uid) return;

      const trimmedId = itemId.trim();
      if (!trimmedId) return;

      await recordRecentlyViewed(user.uid, itemType, trimmedId);
      const items = await fetchUserRecentlyViewed(user.uid);
      setRecentlyViewed(items);
    },
    [user?.uid]
  );

  const clearHistory = React.useCallback(async () => {
    if (!user?.uid) return;
    await clearRecentlyViewedHistory(user.uid);
    setRecentlyViewed([]);
  }, [user?.uid]);

  const value = React.useMemo(
    () => ({
      recentlyViewed,
      loading,
      recordView,
      clearHistory,
    }),
    [recentlyViewed, loading, recordView, clearHistory]
  );

  return (
    <RecentlyViewedContext.Provider value={value}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed(): RecentlyViewedContextValue {
  const context = React.useContext(RecentlyViewedContext);
  if (!context) {
    throw new Error(
      "useRecentlyViewed must be used within RecentlyViewedProvider"
    );
  }
  return context;
}
