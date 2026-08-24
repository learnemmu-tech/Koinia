"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";

import { useContentTenantScope } from "@/hooks/use-workspace-tenant-scope";
import { filterRecordsByChurch, getLegacyDefaultChurchId } from "@/lib/church-scope";
import { db } from "@/lib/firebase";
import {
  DEFAULT_LIST_LIMIT,
  QUERY_GC_TIME,
  QUERY_STALE_TIME,
} from "@/lib/react-query-config";
import {
  isPublicPrayerRequest,
  normalizePrayerRequestFromFirestore,
  PRAYER_REQUESTS_COLLECTION,
} from "@/lib/prayer-request-firestore";

export function useApprovedPrayerRequests(
  initialData: FirebasePrayerRequest[] = [],
  maxItems?: number
) {
  const scope = useContentTenantScope();
  const churchId =
    scope.churchId?.trim() || getLegacyDefaultChurchId() || "";

  const result = useInfiniteQuery({
    queryKey: ["approved-prayers", churchId, maxItems],
    enabled: Boolean(churchId),
    initialPageParam: undefined as
      | QueryDocumentSnapshot<DocumentData>
      | undefined,
    queryFn: async ({ pageParam }) => {
      const pageSize = maxItems ?? DEFAULT_LIST_LIMIT;
      const constraints: QueryConstraint[] = [
        where("churchId", "==", churchId),
        where("status", "==", "approved"),
        orderBy("createdAt", "desc"),
      ];
      if (pageParam) constraints.push(startAfter(pageParam));
      constraints.push(limit(pageSize));

      const snapshot = await getDocs(
        query(collection(db, PRAYER_REQUESTS_COLLECTION), ...constraints)
      );

      const items = filterRecordsByChurch(
        snapshot.docs
          .map((docSnap) =>
            normalizePrayerRequestFromFirestore(
              docSnap.id,
              docSnap.data() as Record<string, unknown>
            )
          )
          .filter(isPublicPrayerRequest),
        churchId
      );
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      return {
        items,
        lastDoc,
        hasMore: maxItems ? false : snapshot.docs.length === pageSize,
      };
    },
    getNextPageParam: (lastPage) =>
      maxItems ? undefined : lastPage.hasMore ? lastPage.lastDoc : undefined,
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });

  const requests =
    result.data?.pages.flatMap((page) => page.items) ?? initialData;

  return {
    requests,
    loading: scope.isLoading || result.isLoading,
    loadMore: result.fetchNextPage,
    hasMore: Boolean(result.hasNextPage),
    loadingMore: result.isFetchingNextPage,
  };
}
