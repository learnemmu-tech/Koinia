import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { BookAccessGate } from "@/components/books/book-access-gate";
import { PhysicalOrderForm } from "@/components/books/physical-order-form";
import { canOrderPhysicalBook } from "@/lib/books/access";
import { getBookViewerContext } from "@/lib/books/viewer-server";
import { getBookById } from "@/lib/postgres/books";
import { pageNarrowClass } from "@/lib/responsive-classes";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function BookOrderPage({ params }: PageProps) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(`/books/${id}/order`)}`);
  }

  const book = await getBookById(id);
  if (!book) notFound();

  const viewer = await getBookViewerContext(userId, book);
  if (!viewer.canView && !viewer.canManage) {
    return (
      <BookAccessGate
        book={book}
        signedIn
        callbackPath={`/books/${book.id}/order`}
      />
    );
  }

  if (!canOrderPhysicalBook(book)) {
    return (
      <div className={`${pageNarrowClass} py-10 text-sm text-muted-foreground`}>
        This physical edition is not available to order right now.
      </div>
    );
  }

  return <PhysicalOrderForm book={book} />;
}
