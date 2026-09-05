"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import {
  DEFAULT_LIST_LIMIT,
  QUERY_GC_TIME,
  QUERY_STALE_TIME,
} from "@/lib/react-query-config";
import { fetchTenantContentPage } from "@/lib/api-client";

type TenantRecord = {
  organizationId?: string;
  churchId?: string;
  branchId?: string | null;
};

import {
  useTenantMatchOptions,
  useWorkspaceTenantScope,
} from "./use-workspace-tenant-scope";
import { useIsPlatformSuperAdmin } from "./use-admin-church-id";

type ListPage<T> = {
  items: T[];
  offset: number;
  hasMore: boolean;
};

export type TenantListQueryOptions<T extends TenantRecord> = {
  queryKey: string;
  collectionName: string;
  orderField: string;
  orderDirection?: "asc" | "desc";
  pageSize?: number;
  normalize?: (id: string, data: Record<string, unknown>) => T;
  extraConstraints?: unknown[];
  churchScopeOnly?: boolean;
  skipTenantGuard?: boolean;
  filterItems?: (items: T[]) => T[];
  initialData?: T[];
};

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
    ],
    enabled,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const page = await fetchTenantContentPage<T>({
        collection: options.collectionName,
        churchId: scope.churchId,
        organizationId: scope.organizationId,
        offset: pageParam,
        limit: pageSize,
      });
      const items = options.filterItems ? options.filterItems(page.items) : page.items;
      return {
        items,
        offset: pageParam,
        hasMore: page.hasMore,
      } satisfies ListPage<T>;
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.offset + pageSize : undefined,
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });

  void matchOptions;

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
