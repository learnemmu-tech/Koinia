import { DEFAULT_LIST_LIMIT } from "@/lib/react-query-config";

export const CATALOG_PAGE_SIZE = DEFAULT_LIST_LIMIT;

export function catalogPageQuery(pageParam: string | undefined): {
  page: number;
  offset: number;
  limit: number;
} {
  const parsed = Number(pageParam);
  const page = Number.isFinite(parsed) && parsed > 1 ? Math.floor(parsed) : 1;
  return {
    page,
    offset: (page - 1) * CATALOG_PAGE_SIZE,
    limit: CATALOG_PAGE_SIZE + 1,
  };
}

export function sliceCatalogPage<T>(rows: T[]): { items: T[]; hasMore: boolean } {
  return {
    items: rows.slice(0, CATALOG_PAGE_SIZE),
    hasMore: rows.length > CATALOG_PAGE_SIZE,
  };
}
