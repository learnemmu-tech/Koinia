import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { BookAccessGate } from "@/components/books/book-access-gate";
import { BookDetail } from "@/components/books/book-detail";
import { getBookViewerContext } from "@/lib/books/viewer-server";
import { getBookById } from "@/lib/postgres/books";
import { buildPageMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const book = await getBookById(id);
  if (!book || book.status !== "published" || book.visibility !== "public") {
    return buildPageMetadata({
      title: "Book",
      description: "Christian book on FaithConnectHub.",
      path: `/books/${id}`,
      noIndex: true,
    });
  }
  return buildPageMetadata({
    title: book.title,
    description: book.description || `A Christian book by ${book.authorName}.`,
    path: `/books/${book.id}`,
    image: book.coverImageUrl ?? undefined,
  });
}

export default async function BookDetailPage({ params }: PageProps) {
  const { id } = await params;
  const book = await getBookById(id);
  if (!book) notFound();

  const { userId } = await auth();
  const viewer = await getBookViewerContext(userId, book);

  if (book.status !== "published" && !viewer.canManage) {
    notFound();
  }

  if (!viewer.canView && !viewer.canManage) {
    return (
      <BookAccessGate
        book={book}
        signedIn={Boolean(userId)}
        callbackPath={`/books/${book.id}`}
      />
    );
  }

  return (
    <BookDetail
      book={book}
      hasDigitalEntitlement={viewer.hasDigitalEntitlement}
      isMemberOfTenant={viewer.isMember || viewer.canManage}
      canManage={viewer.canManage}
    />
  );
}
