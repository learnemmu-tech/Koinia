import { BookCardGrid, BookCardSkeleton } from "@/components/books/book-card";
import { BookPageHeader } from "@/components/books/book-page-header";

export default function DashboardBooksLoading() {
  return (
    <div className="space-y-5 py-4 sm:py-6">
      <BookPageHeader
        title="Books"
        description="Christian books and ministry resources published by churches around the world."
      />
      <BookCardGrid>
        {Array.from({ length: 8 }).map((_, index) => (
          <BookCardSkeleton key={index} />
        ))}
      </BookCardGrid>
    </div>
  );
}
