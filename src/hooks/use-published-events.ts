"use client";

import { useMemo } from "react";
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

import type { FirebaseEvent } from "@/types/firebase-event";

import {
  useContentTenantScope,
  useTenantMatchOptions,
} from "@/hooks/use-workspace-tenant-scope";
import { db } from "@/lib/firebase";
import { filterRecordsByTenant } from "@/lib/organization/tenant-scope";
import {
  DEFAULT_LIST_LIMIT,
  QUERY_GC_TIME,
  QUERY_STALE_TIME,
} from "@/lib/react-query-config";
import {
  EVENTS_COLLECTION,
  filterPublishedEvents,
  normalizeEventFromFirestore,
  splitEventsBySchedule,
} from "@/lib/event-firestore";
import { buildWorkspaceChurchTenantQuery } from "@/lib/tenant-query-builder";

type UsePublishedEventsOptions = {
  maxItems?: number;
  upcomingOnly?: boolean;
};

export function usePublishedEvents(
  initialData: FirebaseEvent[] = [],
  options?: UsePublishedEventsOptions
) {
  const { maxItems, upcomingOnly = false } = options ?? {};
  const scope = useContentTenantScope();
  const matchOptions = useTenantMatchOptions();
  const pageSize = maxItems ?? DEFAULT_LIST_LIMIT;

  const result = useInfiniteQuery({
    queryKey: [
      "published-events",
      scope.churchId,
      scope.organizationId,
      upcomingOnly,
      pageSize,
    ],
    enabled: !scope.blocked,
    initialPageParam: undefined as
      | QueryDocumentSnapshot<DocumentData>
      | undefined,
    queryFn: async ({ pageParam }) => {
      const col = collection(db, EVENTS_COLLECTION);
      const constraints: QueryConstraint[] = [
        where("status", "==", "published"),
        orderBy("eventDate", "asc"),
      ];
      if (pageParam) constraints.push(startAfter(pageParam));
      constraints.push(limit(pageSize));

      const listQuery = buildWorkspaceChurchTenantQuery(col, scope, ...constraints);
      if (!listQuery) {
        return { items: [] as FirebaseEvent[], lastDoc: undefined, hasMore: false };
      }

      const snapshot = await getDocs(listQuery);
      let items = filterRecordsByTenant(
        snapshot.docs.map((docSnap) =>
          normalizeEventFromFirestore(
            docSnap.id,
            docSnap.data() as Record<string, unknown>
          )
        ),
        scope,
        matchOptions
      );
      items = filterPublishedEvents(items);
      if (upcomingOnly) {
        items = splitEventsBySchedule(items).upcoming;
      }

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

  const events = result.data?.pages.flatMap((page) => page.items) ?? initialData;
  const loading = scope.isLoading || (result.isLoading && !scope.blocked);

  const grouped = useMemo(() => splitEventsBySchedule(events), [events]);

  return {
    events,
    grouped,
    loading,
    loadMore: result.fetchNextPage,
    hasMore: Boolean(result.hasNextPage),
    loadingMore: result.isFetchingNextPage,
  };
}
