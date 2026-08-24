"use client";

import { useTenantListQuery } from "@/hooks/use-tenant-list-query";
import {
  normalizePrayerRequestFromFirestore,
} from "@/lib/prayer-request-firestore";
import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";

/**
 * Workspace moderation: all prayer requests for the active church.
 */
export function useAllPrayerRequests(
  initialData: FirebasePrayerRequest[] = []
) {
  const result = useTenantListQuery({
    queryKey: "all-prayer-requests",
    collectionName: "prayerRequests",
    orderField: "createdAt",
    churchScopeOnly: true,
    normalize: normalizePrayerRequestFromFirestore,
    initialData,
  });

  return {
    requests: result.data,
    loading: result.loading,
    loadMore: result.loadMore,
    hasMore: result.hasMore,
    loadingMore: result.loadingMore,
  };
}
