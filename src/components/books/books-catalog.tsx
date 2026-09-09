"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  BookCard,
  BookCardGrid,
} from "@/components/books/book-card";
import { BooksToolbar } from "@/components/books/books-toolbar";
import { Button } from "@/components/ui/button";
import { filterBooks, type BookEditionFilter } from "@/lib/books/filters";
import type { BookRecord } from "@/types/book";

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
  const [editionFilter, setEditionFilter] = useState<BookEditionFilter>("all");

  const visible = useMemo(
    () =>
      filterBooks({
        books,
        query,
        editionFilter,
      }),
    [books, editionFilter, query]
  );

  const emptyLibrary = books.length === 0;

  return (
    <div className="space-y-5">
      <BooksToolbar
        search={query}
        onSearchChange={setQuery}
        editionFilter={editionFilter}
        onEditionFilterChange={setEditionFilter}
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
                    {t("create")}
                  </Link>
                </Button>
              : null}
            </>
          : <p className="text-sm text-muted-foreground">
              {tc("noResults")}
            </p>
          }
        </div>
      : <BookCardGrid>
          {visible.map((book) => (
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
      }
    </div>
  );
}
