import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function SuperAdminPagination({
  page,
  totalPages,
  totalItems,
  buildHref,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  buildHref: (page: number) => string;
}) {
  if (totalItems <= 0 || totalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-border/50 bg-card px-4 py-3 sm:flex-row">
      <p className="text-xs text-muted-foreground">
        Page {page} of {totalPages} · {totalItems} items
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          disabled={page <= 1}
          asChild={page > 1}
        >
          {page > 1 ? (
            <Link href={buildHref(page - 1)}>
              <ChevronLeft className="size-4" />
              Previous
            </Link>
          ) : (
            <>
              <ChevronLeft className="size-4" />
              Previous
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          disabled={page >= totalPages}
          asChild={page < totalPages}
        >
          {page < totalPages ? (
            <Link href={buildHref(page + 1)}>
              Next
              <ChevronRight className="size-4" />
            </Link>
          ) : (
            <>
              Next
              <ChevronRight className="size-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
