"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import {
  DEFAULT_LIST_LIMIT,
  QUERY_GC_TIME,
  QUERY_STALE_TIME,
} from "@/lib/react-query-config";
import { db } from "@/lib/firebase";
import {
  filterRecordsByTenant,
  type TenantMatchOptions,
  type TenantScope,
} from "@/lib/organization/tenant-scope";
import {
  buildChurchScopedQuery,
  buildWorkspaceChurchTenantQuery,
} from "@/lib/tenant-query-builder";

import {
  useTenantMatchOptions,
  useWorkspaceTenantScope,
} from "./use-workspace-tenant-scope";
import { useIsPlatformSuperAdmin } from "./use-admin-church-id";

type ListPage<T> = {
  items: T[];
  lastDoc?: QueryDocumentSnapshot<DocumentData>;
  hasMore: boolean;
};

type TenantRecord = {
  organizationId?: string;
  churchId?: string;
  branchId?: string | null;
};

export type TenantListQueryOptions<T extends TenantRecord> = {
  queryKey: string;
  collectionName: string;
  orderField: string;
  orderDirection?: "asc" | "desc";
  pageSize?: number;
  normalize: (id: string, data: Record<string, unknown>) => T;
  extraConstraints?: QueryConstraint[];
  /** Query by churchId only (prayer requests). */
  churchScopeOnly?: boolean;
  /** Skip tenant guard — e.g. super-admin churches list. */
  skipTenantGuard?: boolean;
  filterItems?: (items: T[]) => T[];
  initialData?: T[];
};

function applyTenantFilter<T extends TenantRecord>(
  records: T[],
  scope: TenantScope,
  matchOptions: TenantMatchOptions
): T[] {
  return filterRecordsByTenant(records, scope, matchOptions);
}

async function fetchTenantListPage<T extends TenantRecord>(input: {
  collectionName: string;
  scope: TenantScope;
  matchOptions: TenantMatchOptions;
  orderField: string;
  orderDirection: "asc" | "desc";
  pageSize: number;
  normalize: (id: string, data: Record<string, unknown>) => T;
  extraConstraints: QueryConstraint[];
  churchScopeOnly: boolean;
  pageParam?: QueryDocumentSnapshot<DocumentData>;
  filterItems?: (items: T[]) => T[];
}): Promise<ListPage<T>> {
  const col = collection(db, input.collectionName);
  const ordering: QueryConstraint[] = [
    ...input.extraConstraints,
    orderBy(input.orderField, input.orderDirection),
  ];

  if (input.pageParam) {
    ordering.push(startAfter(input.pageParam));
  }
  ordering.push(limit(input.pageSize));

  const baseQuery = input.churchScopeOnly
    ? buildChurchScopedQuery(col, input.scope.churchId, ...ordering)
    : buildWorkspaceChurchTenantQuery(col, input.scope, ...ordering);

  if (!baseQuery) {
    return { items: [], hasMore: false };
  }

  const snapshot = await getDocs(baseQuery);
  let items = snapshot.docs.map((docSnap) =>
    input.normalize(docSnap.id, docSnap.data() as Record<string, unknown>)
  );

  if (!input.churchScopeOnly) {
    items = applyTenantFilter(items, input.scope, input.matchOptions);
  }

  if (input.filterItems) {
    items = input.filterItems(items);
  }

  const lastDoc = snapshot.docs[snapshot.docs.length - 1];
  return {
    items,
    lastDoc,
    hasMore: snapshot.docs.length === input.pageSize,
  };
}

export function useTenantListQuery<T extends TenantRecord>(
  options: TenantListQueryOptions<T>
) {
  const scope = useWorkspaceTenantScope();
  const matchOptions = useTenantMatchOptions();
  const isSuperAdmin = useIsPlatformSuperAdmin();
  const pageSize = options.pageSize ?? DEFAULT_LIST_LIMIT;

  const blocked =
    !options.skipTenantGuard && scope.blocked && !isSuperAdmin;
  const enabled =
    !blocked &&
    (options.skipTenantGuard ||
      Boolean(scope.churchId?.trim()) ||
      Boolean(scope.organizationId?.trim()));

  const result = useInfiniteQuery({
    queryKey: [
      options.queryKey,
      scope.churchId,
      scope.organizationId,
      scope.branchId,
      pageSize,
      options.extraConstraints?.length ?? 0,
    ],
    enabled,
    initialPageParam: undefined as
      | QueryDocumentSnapshot<DocumentData>
      | undefined,
    queryFn: ({ pageParam }) =>
      fetchTenantListPage({
        collectionName: options.collectionName,
        scope,
        matchOptions,
        orderField: options.orderField,
        orderDirection: options.orderDirection ?? "desc",
        pageSize,
        normalize: options.normalize,
        extraConstraints: options.extraConstraints ?? [],
        churchScopeOnly: options.churchScopeOnly ?? false,
        pageParam,
        filterItems: options.filterItems,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastDoc : undefined,
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });

  const data =
    result.data?.pages.flatMap((page) => page.items) ??
    options.initialData ??
    [];

  return {
    data,
    loading: result.isLoading,
    error: result.error ? "Unable to sync data. Please refresh and try again." : null,
    loadMore: result.fetchNextPage,
    hasMore: Boolean(result.hasNextPage),
    loadingMore: result.isFetchingNextPage,
    isFetching: result.isFetching,
  };
}
