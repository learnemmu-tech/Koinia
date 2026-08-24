"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type AdminListPaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
};

export function AdminListPagination({
  page,
  totalPages,
  totalItems,
  onPageChange,
}: AdminListPaginationProps) {
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
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
