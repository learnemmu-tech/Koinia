import type { BookStatus, BookType } from "@/types/book";
import type { BookRecord } from "@/types/book";

export type BookEditionFilter = "all" | BookType;

/** Public catalog chips: All / Digital / Physical / Free / Paid */
export type BookCatalogFilter = "all" | "digital" | "physical" | "free" | "paid";

export type BookSortOption = "latest" | "title" | "author";

export function matchesBookEditionFilter(
  bookType: BookType,
  filter: BookEditionFilter
): boolean {
  if (filter === "all") return true;
  if (filter === "both") return bookType === "both";
  if (filter === "digital") return bookType === "digital" || bookType === "both";
  if (filter === "physical") return bookType === "physical" || bookType === "both";
  return bookType === filter;
}

export function matchesBookStatusFilter(
  status: BookStatus,
  filter: "all" | BookStatus
): boolean {
  return filter === "all" || status === filter;
}

function bookHasFreeAccess(book: Pick<BookRecord, "digital" | "physical">): boolean {
  if (book.digital?.accessMode === "free") return true;
  if (book.physical && book.physical.priceCents <= 0) return true;
  return false;
}

function bookHasPaidAccess(book: Pick<BookRecord, "digital" | "physical">): boolean {
  if (book.digital?.accessMode === "paid") return true;
  if (book.physical && book.physical.priceCents > 0) return true;
  return false;
}

export function matchesBookCatalogFilter(
  book: Pick<BookRecord, "bookType" | "digital" | "physical">,
  filter: BookCatalogFilter
): boolean {
  if (filter === "all") return true;
  if (filter === "digital") {
    return book.bookType === "digital" || book.bookType === "both";
  }
  if (filter === "physical") {
    return book.bookType === "physical" || book.bookType === "both";
  }
  if (filter === "free") return bookHasFreeAccess(book);
  if (filter === "paid") return bookHasPaidAccess(book);
  return true;
}

export function filterBooks<T extends {
  title: string;
  authorName: string;
  churchName: string;
  bookType: BookType;
  status: BookStatus;
}>({
  books,
  query,
  editionFilter,
  statusFilter = "all",
}: {
  books: T[];
  query: string;
  editionFilter: BookEditionFilter;
  statusFilter?: "all" | BookStatus;
}): T[] {
  const q = query.trim().toLowerCase();
  return books.filter((book) => {
    if (!matchesBookEditionFilter(book.bookType, editionFilter)) return false;
    if (!matchesBookStatusFilter(book.status, statusFilter)) return false;
    if (!q) return true;
    return (
      book.title.toLowerCase().includes(q) ||
      book.authorName.toLowerCase().includes(q) ||
      book.churchName.toLowerCase().includes(q)
    );
  });
}

export function filterCatalogBooks({
  books,
  query,
  catalogFilter,
}: {
  books: BookRecord[];
  query: string;
  catalogFilter: BookCatalogFilter;
}): BookRecord[] {
  const q = query.trim().toLowerCase();
  return books.filter((book) => {
    if (!matchesBookCatalogFilter(book, catalogFilter)) return false;
    if (!q) return true;
    return (
      book.title.toLowerCase().includes(q) ||
      book.authorName.toLowerCase().includes(q) ||
      book.churchName.toLowerCase().includes(q) ||
      book.description.toLowerCase().includes(q)
    );
  });
}

export function sortCatalogBooks(
  books: BookRecord[],
  sort: BookSortOption
): BookRecord[] {
  const next = [...books];
  if (sort === "title") {
    next.sort((a, b) => a.title.localeCompare(b.title));
    return next;
  }
  if (sort === "author") {
    next.sort((a, b) => a.authorName.localeCompare(b.authorName));
    return next;
  }
  // Latest first
  next.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return next;
}
