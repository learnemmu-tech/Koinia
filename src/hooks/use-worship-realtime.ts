"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  startAfter,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import type { FirebaseArticle } from "@/types/firebase-article";
import type { FirebaseSermon } from "@/types/firebase-sermon";
import type { FirebaseSong } from "@/types/firebase-song";

import { normalizeArticleFromFirestore } from "@/lib/article-firestore";
import { db } from "@/lib/firebase";
import { filterRecordsByTenant } from "@/lib/organization/tenant-scope";
import {
  DEFAULT_LIST_LIMIT,
  QUERY_GC_TIME,
  QUERY_STALE_TIME,
} from "@/lib/react-query-config";
import {
  LEGACY_SERMONS_COLLECTION,
  mergeSermonsById,
  normalizeSermonFromFirestore,
  SERMONS_COLLECTION,
} from "@/lib/sermon-firestore";
import { normalizeSongFromFirestore } from "@/lib/song-firestore";
import { buildWorkspaceChurchTenantQuery } from "@/lib/tenant-query-builder";
import {
  useContentTenantScope,
  useTenantMatchOptions,
} from "@/hooks/use-workspace-tenant-scope";

export type RealtimeCollectionState<T> = {
  data: T[];
  syncing: boolean;
  loadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
};

type ContentScope = ReturnType<typeof useContentTenantScope>;
type MatchOptions = ReturnType<typeof useTenantMatchOptions>;

type TenantRecord = {
  organizationId?: string;
  churchId?: string;
  branchId?: string | null;
};

type ContentPage<T> = {
  items: T[];
  lastDoc?: QueryDocumentSnapshot<DocumentData>;
  hasMore: boolean;
};

function useContentListQuery<T extends TenantRecord>(input: {
  queryKey: string;
  collectionName: string;
  orderField: string;
  normalize: (id: string, data: Record<string, unknown>) => T;
  initialData: T[];
}): RealtimeCollectionState<T> {
  const scope = useContentTenantScope();
  const matchOptions = useTenantMatchOptions();
  const blocked = scope.blocked;

  const result = useInfiniteQuery({
    queryKey: [
      input.queryKey,
      scope.churchId ?? "",
      scope.organizationId ?? "",
      scope.branchId ?? "",
    ] as const,
    enabled: !blocked,
    initialPageParam: undefined as
      | QueryDocumentSnapshot<DocumentData>
      | undefined,
    queryFn: async ({ pageParam }) =>
      fetchContentPage(
        input.collectionName,
        input.orderField,
        input.normalize,
        scope,
        matchOptions,
        pageParam
      ),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastDoc : undefined,
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });

  const data: T[] =
    result.data?.pages.flatMap((page) => page.items) ?? input.initialData;

  return {
    data,
    syncing: !blocked && (result.isLoading || result.isFetching),
    loadMore: result.fetchNextPage,
    hasMore: Boolean(result.hasNextPage),
    loadingMore: result.isFetchingNextPage,
  };
}

async function fetchContentPage<T extends TenantRecord>(
  collectionName: string,
  orderField: string,
  normalize: (id: string, data: Record<string, unknown>) => T,
  scope: ContentScope,
  matchOptions: MatchOptions,
  pageParam?: QueryDocumentSnapshot<DocumentData>
): Promise<ContentPage<T>> {
  const col = collection(db, collectionName);
  const constraints: QueryConstraint[] = [orderBy(orderField, "desc")];
  if (pageParam) constraints.push(startAfter(pageParam));
  constraints.push(limit(DEFAULT_LIST_LIMIT));

  const listQuery = buildWorkspaceChurchTenantQuery(col, scope, ...constraints);
  if (!listQuery) {
    return { items: [] as T[], lastDoc: undefined, hasMore: false };
  }

  const snapshot = await getDocs(listQuery);
  const items = filterRecordsByTenant(
    snapshot.docs.map((docSnap) =>
      normalize(docSnap.id, docSnap.data() as Record<string, unknown>)
    ),
    scope,
    matchOptions
  ) as T[];
  const lastDoc = snapshot.docs[snapshot.docs.length - 1];
  return {
    items,
    lastDoc,
    hasMore: snapshot.docs.length === DEFAULT_LIST_LIMIT,
  };
}

async function fetchSermonPage(
  collectionName: string,
  scope: ContentScope,
  matchOptions: MatchOptions,
  pageParam?: QueryDocumentSnapshot<DocumentData>
) {
  return fetchContentPage(
    collectionName,
    "dateCreated",
    normalizeSermonFromFirestore,
    scope,
    matchOptions,
    pageParam
  );
}

export function useRealtimeSongs(
  initialSongs: FirebaseSong[]
): RealtimeCollectionState<FirebaseSong> {
  return useContentListQuery({
    queryKey: "content-songs",
    collectionName: "songs",
    orderField: "createdAt",
    normalize: normalizeSongFromFirestore,
    initialData: initialSongs,
  });
}

export function useRealtimeSermons(
  initialSermons: FirebaseSermon[]
): RealtimeCollectionState<FirebaseSermon> {
  const scope = useContentTenantScope();
  const matchOptions = useTenantMatchOptions();
  const blocked = scope.blocked;

  const primary = useInfiniteQuery({
    queryKey: [
      "content-sermons",
      scope.churchId ?? "",
      scope.organizationId ?? "",
    ] as const,
    enabled: !blocked,
    initialPageParam: undefined as QueryDocumentSnapshot<DocumentData> | undefined,
    queryFn: async ({ pageParam }) =>
      fetchSermonPage(SERMONS_COLLECTION, scope, matchOptions, pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastDoc : undefined,
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });

  const legacy = useInfiniteQuery({
    queryKey: [
      "content-sermons-legacy",
      scope.churchId ?? "",
      scope.organizationId ?? "",
    ] as const,
    enabled: !blocked,
    initialPageParam: undefined as QueryDocumentSnapshot<DocumentData> | undefined,
    queryFn: async ({ pageParam }) =>
      fetchSermonPage(LEGACY_SERMONS_COLLECTION, scope, matchOptions, pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastDoc : undefined,
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });

  const data = useMemo(() => {
    const primaryItems = primary.data?.pages.flatMap((p) => p.items) ?? [];
    const legacyItems = legacy.data?.pages.flatMap((p) => p.items) ?? [];
    const merged = mergeSermonsById([primaryItems, legacyItems]);
    return merged.length > 0 ? merged : initialSermons;
  }, [primary.data, legacy.data, initialSermons]);

  return {
    data,
    syncing:
      primary.isLoading ||
      legacy.isLoading ||
      primary.isFetching ||
      legacy.isFetching,
    loadMore: () => {
      void primary.fetchNextPage();
      void legacy.fetchNextPage();
    },
    hasMore: Boolean(primary.hasNextPage || legacy.hasNextPage),
    loadingMore: primary.isFetchingNextPage || legacy.isFetchingNextPage,
  };
}

export function useRealtimeArticles(
  initialArticles: FirebaseArticle[]
): RealtimeCollectionState<FirebaseArticle> {
  return useContentListQuery({
    queryKey: "content-articles",
    collectionName: "articles",
    orderField: "dateCreated",
    normalize: normalizeArticleFromFirestore,
    initialData: initialArticles,
  });
}
