"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { BookCard, BookCardGrid } from "@/components/books/book-card";
import { BooksToolbar } from "@/components/books/books-toolbar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  filterCatalogBooks,
  sortCatalogBooks,
  type BookCatalogFilter,
  type BookSortOption,
} from "@/lib/books/filters";
import { cn } from "@/lib/utils";
import type { BookRecord } from "@/types/book";

const PAGE_SIZE_OPTIONS = [8, 12, 16, 24] as const;

export function BooksCatalog({
  books,
  canManage = false,
}: {
  books: BookRecord[];
  canManage?: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("books");
  const tc = useTranslations("common");
  const [query, setQuery] = useState("");
  const [catalogFilter, setCatalogFilter] = useState<BookCatalogFilter>("all");
  const [sort, setSort] = useState<BookSortOption>("latest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(8);

  const visible = useMemo(() => {
    const filtered = filterCatalogBooks({
      books,
      query,
      catalogFilter,
    });
    return sortCatalogBooks(filtered, sort);
  }, [books, catalogFilter, query, sort]);

  const total = visible.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = total === 0 ? 0 : (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  const pageItems = visible.slice(startIndex, endIndex);

  const emptyLibrary = books.length === 0;

  function resetToFirstPage() {
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <BooksToolbar
        variant="catalog"
        search={query}
        onSearchChange={(value) => {
          setQuery(value);
          resetToFirstPage();
        }}
        catalogFilter={catalogFilter}
        onCatalogFilterChange={(value) => {
          setCatalogFilter(value);
          resetToFirstPage();
        }}
        sort={sort}
        onSortChange={(value) => {
          setSort(value);
          resetToFirstPage();
        }}
      />

      {visible.length === 0 ?
        <div className="rounded-xl border border-dashed border-border px-5 py-12 text-center">
          {emptyLibrary ?
            <>
              <p className="text-sm font-medium text-foreground">
                No books published yet.
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Add your first Christian book or ministry resource to begin building
                your library.
              </p>
              {canManage ?
                <Button asChild size="sm" className="mt-4 h-9">
                  <Link href="/dashboard/books/new">
                    <Plus className="size-4" aria-hidden />
                    {t("addBook")}
                  </Link>
                </Button>
              : null}
            </>
          : <p className="text-sm text-muted-foreground">{tc("noResults")}</p>
          }
        </div>
      : <>
          <BookCardGrid>
            {pageItems.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                href={`/books/${book.id}`}
                onEdit={
                  canManage ?
                    () => router.push(`/dashboard/books/${book.id}/edit`)
                  : undefined
                }
              />
            ))}
          </BookCardGrid>

          <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground sm:text-sm">
              {t("showingRange", {
                start: startIndex + 1,
                end: endIndex,
                total,
              })}
            </p>

            <div className="flex items-center justify-center gap-1">
              <PaginationButton
                ariaLabel={t("previousPage")}
                disabled={currentPage <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                <ChevronLeft className="size-4" aria-hidden />
              </PaginationButton>
              {Array.from({ length: totalPages }, (_, index) => index + 1)
                .filter((pageNumber) => {
                  if (totalPages <= 5) return true;
                  return (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    Math.abs(pageNumber - currentPage) <= 1
                  );
                })
                .map((pageNumber, index, list) => {
                  const prev = list[index - 1];
                  const showEllipsis = prev != null && pageNumber - prev > 1;
                  return (
                    <span key={pageNumber} className="contents">
                      {showEllipsis ?
                        <span className="px-1 text-xs text-muted-foreground">…</span>
                      : null}
                      <PaginationButton
                        ariaLabel={t("pageNumber", { page: pageNumber })}
                        active={pageNumber === currentPage}
                        onClick={() => setPage(pageNumber)}
                      >
                        {pageNumber}
                      </PaginationButton>
                    </span>
                  );
                })}
              <PaginationButton
                ariaLabel={t("nextPage")}
                disabled={currentPage >= totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              >
                <ChevronRight className="size-4" aria-hidden />
              </PaginationButton>
            </div>

            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value) as (typeof PAGE_SIZE_OPTIONS)[number]);
                resetToFirstPage();
              }}
            >
              <SelectTrigger
                aria-label={t("perPageAria")}
                className="h-9 w-auto min-w-[7.5rem] rounded-lg border-border/70 bg-card text-xs shadow-sm sm:ml-auto"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {t("perPage", { count: size })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      }
    </div>
  );
}

function PaginationButton({
  children,
  onClick,
  disabled,
  active,
  ariaLabel,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-md border text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-40",
        active ?
          "border-primary bg-primary text-primary-foreground"
        : "border-border/70 bg-card text-foreground hover:bg-muted/60"
      )}
    >
      {children}
    </button>
  );
}
