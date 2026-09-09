import type { BookStatus, BookType } from "@/types/book";

export type BookEditionFilter = "all" | BookType;

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
