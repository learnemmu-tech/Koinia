"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import {
  BookCard,
  BookCardGrid,
} from "@/components/books/book-card";
import { BooksListHeader } from "@/components/books/books-list-header";
import { BooksToolbar } from "@/components/books/books-toolbar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { deleteManagedBook, saveBook } from "@/lib/books/books-client";
import { filterBooks, type BookEditionFilter } from "@/lib/books/filters";
import type { BookRecord, BookStatus } from "@/types/book";
import type { UpsertBookInput } from "@/lib/books/validation";
import { useTranslations } from "next-intl";

function toUpsertInput(book: BookRecord, status: BookStatus): UpsertBookInput {
  return {
    churchId: book.churchId,
    title: book.title,
    authorName: book.authorName,
    description: book.description,
    language: book.language,
    currency: book.currency,
    status,
    visibility: book.visibility,
    bookType: book.bookType,
    digital: book.digital ?
      {
        accessMode: book.digital.accessMode,
        priceCents: book.digital.priceCents,
        currency: book.digital.currency,
      }
    : null,
    physical: book.physical ?
      {
        priceCents: book.physical.priceCents,
        currency: book.physical.currency,
        stockQuantity: book.physical.stockQuantity,
        sku: book.physical.sku,
        weightGrams: book.physical.weightGrams,
        shippingAvailable: book.physical.shippingAvailable,
        isActive: book.physical.isActive,
      }
    : null,
  };
}

export function BooksAdminPageClient({
  initialBooks,
}: {
  initialBooks: BookRecord[];
}) {
  const router = useRouter();
  const { user } = useFirebaseAuth();
  const t = useTranslations("books");
  const tc = useTranslations("common");
  const [books, setBooks] = useState(initialBooks);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | BookStatus>("all");
  const [editionFilter, setEditionFilter] = useState<BookEditionFilter>("all");
  const [pendingDelete, setPendingDelete] = useState<BookRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const visible = useMemo(
    () =>
      filterBooks({
        books,
        query: search,
        editionFilter,
        statusFilter,
      }),
    [books, editionFilter, search, statusFilter]
  );

  async function archiveBook(book: BookRecord) {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const { book: saved } = await saveBook(
        token,
        toUpsertInput(book, "archived"),
        book.id
      );
      setBooks((current) =>
        current.map((item) => (item.id === saved.id ? saved : item))
      );
      toast.success("Book archived.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not archive the book.");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete || !user) return;
    setDeleting(true);
    try {
      const token = await user.getIdToken();
      await deleteManagedBook(token, pendingDelete.id);
      setBooks((current) => current.filter((book) => book.id !== pendingDelete.id));
      toast.success("Book deleted.");
      setPendingDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete the book.");
    } finally {
      setDeleting(false);
    }
  }

  const emptyLibrary = books.length === 0;

  return (
    <div className="space-y-5 py-4 sm:py-6">
      <BooksListHeader
        action={
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/books/orders"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Orders
            </Link>
            <Button asChild size="sm" className="h-9">
              <Link href="/dashboard/books/new">
                <Plus className="size-4" aria-hidden />
                {t("create")}
              </Link>
            </Button>
          </div>
        }
      />

      <BooksToolbar
        variant="admin"
        search={search}
        onSearchChange={setSearch}
        editionFilter={editionFilter}
        onEditionFilterChange={setEditionFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        showStatusFilter
      />

      {visible.length === 0 ?
        <div className="rounded-xl border border-dashed border-border px-5 py-12 text-center">
          {emptyLibrary ?
            <>
              <p className="text-sm font-medium">No books published yet.</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Add your first Christian book or ministry resource to begin building
                your library.
              </p>
              <Button asChild size="sm" className="mt-4 h-9">
                <Link href="/dashboard/books/new">
                  <Plus className="size-4" aria-hidden />
                  {t("create")}
                </Link>
              </Button>
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
              showStatus
              onEdit={() => router.push(`/dashboard/books/${book.id}/edit`)}
              onArchive={() => void archiveBook(book)}
              onDelete={() => setPendingDelete(book)}
            />
          ))}
        </BookCardGrid>
      }

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open && !deleting) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete ?
                t("deleteDescriptionNamed", { title: pendingDelete.title })
              : t("deleteDescriptionGeneric")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel disabled={deleting}>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()} disabled={deleting}>
              {deleting ? tc("deleting") : tc("delete")}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
