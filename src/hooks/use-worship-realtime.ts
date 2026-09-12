"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import type { FirebaseArticle } from "@/types/firebase-article";
import type { FirebaseSermon } from "@/types/firebase-sermon";
import type { FirebaseSong } from "@/types/firebase-song";

import { fetchTenantContentPage } from "@/lib/api-client";
import {
  DEFAULT_LIST_LIMIT,
  QUERY_GC_TIME,
  QUERY_STALE_TIME,
} from "@/lib/react-query-config";
import { useContentTenantScope } from "@/hooks/use-workspace-tenant-scope";

export type RealtimeCollectionState<T> = {
  data: T[];
  syncing: boolean;
  loadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
};

function useContentListQuery<T>(input: {
  queryKey: string;
  collectionName: string;
  initialData: T[];
  clientSync?: boolean;
}): RealtimeCollectionState<T> {
  const scope = useContentTenantScope();
  const clientSync = input.clientSync !== false;
  const blocked = scope.blocked;

  const result = useInfiniteQuery({
    queryKey: [
      input.queryKey,
      scope.churchId ?? "",
      scope.organizationId ?? "",
    ] as const,
    enabled: clientSync && !blocked,
    initialPageParam: 0,
    initialData: {
      pages: [
        {
          items: input.initialData,
          hasMore: input.initialData.length >= DEFAULT_LIST_LIMIT,
        },
      ],
      pageParams: [0],
    },
    initialDataUpdatedAt: Date.now(),
    // SSR already hydrated page 0; do not refetch on mount/key settle.
    refetchOnMount: false,
    queryFn: async ({ pageParam }) => {
      const page = await fetchTenantContentPage<T>({
        collection: input.collectionName,
        churchId: scope.churchId,
        organizationId: scope.organizationId,
        offset: pageParam,
        limit: DEFAULT_LIST_LIMIT,
      });
      return page;
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore ? pages.length * DEFAULT_LIST_LIMIT : undefined,
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });

  const data: T[] =
    result.data?.pages.flatMap((page) => page.items) ?? input.initialData;

  return {
    data,
    syncing: clientSync && !blocked && result.isLoading && data.length === 0,
    loadMore: result.fetchNextPage,
    hasMore: clientSync && Boolean(result.hasNextPage),
    loadingMore: result.isFetchingNextPage,
  };
}

export function useRealtimeSongs(
  initialSongs: FirebaseSong[],
  options?: { clientSync?: boolean }
): RealtimeCollectionState<FirebaseSong> {
  return useContentListQuery({
    queryKey: "content-songs",
    collectionName: "songs",
    initialData: initialSongs,
    clientSync: options?.clientSync,
  });
}

export function useRealtimeSermons(
  initialSermons: FirebaseSermon[],
  options?: { clientSync?: boolean }
): RealtimeCollectionState<FirebaseSermon> {
  return useContentListQuery({
    queryKey: "content-sermons",
    collectionName: "sermons",
    initialData: initialSermons,
    clientSync: options?.clientSync,
  });
}

export function useRealtimeArticles(
  initialArticles: FirebaseArticle[],
  options?: { clientSync?: boolean }
): RealtimeCollectionState<FirebaseArticle> {
  return useContentListQuery({
    queryKey: "content-articles",
    collectionName: "articles",
    initialData: initialArticles,
    clientSync: options?.clientSync,
  });
}
