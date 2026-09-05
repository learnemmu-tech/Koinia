"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";

import { fetchTenantContentPage } from "@/lib/api-client";
import { useContentTenantScope } from "@/hooks/use-workspace-tenant-scope";
import { isPublicPrayerRequest } from "@/lib/prayer-request-firestore";
import {
  DEFAULT_LIST_LIMIT,
  QUERY_GC_TIME,
  QUERY_STALE_TIME,
} from "@/lib/react-query-config";

export function useApprovedPrayerRequests(
  initialData: FirebasePrayerRequest[] = [],
  maxItems?: number
) {
  const scope = useContentTenantScope();
  const churchId = scope.churchId?.trim() ?? "";
  const pageSize = maxItems ?? DEFAULT_LIST_LIMIT;

  const result = useInfiniteQuery({
    queryKey: ["approved-prayers", churchId, maxItems],
    enabled: Boolean(churchId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const page = await fetchTenantContentPage<FirebasePrayerRequest>({
        collection: "prayerRequests",
        churchId,
        organizationId: scope.organizationId,
        offset: pageParam,
        limit: pageSize,
      });
      const items = page.items.filter(
        (request) => request.status === "approved" && isPublicPrayerRequest(request)
      );
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
