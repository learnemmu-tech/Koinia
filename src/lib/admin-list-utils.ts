export const ADMIN_PAGE_SIZE = 10;

export function filterBySearch<T>(
  items: T[],
  search: string,
  getSearchText: (item: T) => string
): T[] {
  const query = search.trim().toLowerCase();
  if (!query) return items;
  return items.filter((item) =>
    getSearchText(item).toLowerCase().includes(query)
  );
}

export function paginateItems<T>(
  items: T[],
  page: number,
  pageSize = ADMIN_PAGE_SIZE
): { pageItems: T[]; totalPages: number; safePage: number } {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    pageItems: items.slice(start, start + pageSize),
    totalPages,
    safePage,
  };
}

export type PublishFilter = "all" | "published" | "draft";

export function filterByPublishStatus<T>(
  items: T[],
  filter: PublishFilter,
  isPublished: (item: T) => boolean
): T[] {
  if (filter === "all") return items;
  if (filter === "published") return items.filter(isPublished);
  return items.filter((item) => !isPublished(item));
}
