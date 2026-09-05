"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import type { FirebaseEvent } from "@/types/firebase-event";

import { fetchTenantContentPage } from "@/lib/api-client";
import { useContentTenantScope } from "@/hooks/use-workspace-tenant-scope";
import {
  DEFAULT_LIST_LIMIT,
  QUERY_GC_TIME,
  QUERY_STALE_TIME,
} from "@/lib/react-query-config";
import {
  filterPublishedEvents,
  splitEventsBySchedule,
} from "@/lib/event-firestore";

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
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const page = await fetchTenantContentPage<FirebaseEvent>({
        collection: "events",
        churchId: scope.churchId,
        organizationId: scope.organizationId,
        offset: pageParam,
        limit: pageSize,
      });
      let items = filterPublishedEvents(page.items);
      if (upcomingOnly) {
        items = splitEventsBySchedule(items).upcoming;
      }
      return {
        items,
        hasMore: maxItems ? false : page.hasMore,
      };
    },
    getNextPageParam: (lastPage, pages) =>
      maxItems ? undefined : lastPage.hasMore ? pages.length * pageSize : undefined,
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
