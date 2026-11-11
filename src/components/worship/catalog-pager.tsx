import Link from "next/link";

export function CatalogPager({
  page,
  hasMore,
}: {
  page: number;
  hasMore: boolean;
}) {
  if (page <= 1 && !hasMore) return null;
  return (
    <nav className="flex items-center justify-center gap-4 pt-4 text-sm" aria-label="Catalog pages">
      {page > 1 ? (
        <Link className="underline" href={page === 2 ? "?" : `?page=${page - 1}`}>
          Previous
        </Link>
      ) : (
        <span />
      )}
      <span>Page {page}</span>
      {hasMore ? (
        <Link className="underline" href={`?page=${page + 1}`}>
          Next
        </Link>
      ) : null}
    </nav>
  );
}
