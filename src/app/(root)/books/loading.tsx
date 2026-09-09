import { BookCardGrid, BookCardSkeleton } from "@/components/books/book-card";
import { BookPageHeader } from "@/components/books/book-page-header";
import { pageContentClass } from "@/lib/responsive-classes";

export default function BooksLoading() {
  return (
    <section className={pageContentClass}>
      <BookPageHeader
        title="Books"
        description="Christian books and ministry resources published by churches around the world."
      />
      <BookCardGrid>
        {Array.from({ length: 8 }).map((_, index) => (
          <BookCardSkeleton key={index} />
        ))}
      </BookCardGrid>
    </section>
  );
}
