import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { BookAccessGate } from "@/components/books/book-access-gate";
import { BookDetail } from "@/components/books/book-detail";
import { getBookViewerContext } from "@/lib/books/viewer-server";
import { getBookById } from "@/lib/postgres/books";
import { churchWebsitePath } from "@/lib/templates/paths";
import { requireChurchWebsite } from "@/lib/templates/require-church-website";
import { HeritageDetailFrame } from "@/templates/heritage/components/heritage-content-frame";

export const dynamic = "force-dynamic";

export default async function ChurchBookDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const { model } = await requireChurchWebsite(slug);
  const book = await getBookById(decodeURIComponent(id));
  if (!book || book.churchId !== model.church.id) notFound();

  const { userId } = await auth();
  const viewer = await getBookViewerContext(userId, book);
  const listHref = churchWebsitePath(model.church.slug, "/books");
  const homeHref = churchWebsitePath(model.church.slug);
  const callbackPath = churchWebsitePath(model.church.slug, `/books/${book.id}`);

  if (book.status !== "published" && !viewer.canManage) {
    notFound();
  }

  if (!viewer.canView && !viewer.canManage) {
    const gate = (
      <BookAccessGate
        book={book}
        signedIn={Boolean(userId)}
        callbackPath={callbackPath}
        listHref={listHref}
      />
    );
    return model.templateId === "heritage" ?
        <HeritageDetailFrame>{gate}</HeritageDetailFrame>
      : gate;
  }

  const detail = (
    <BookDetail
      book={book}
      hasDigitalEntitlement={viewer.hasDigitalEntitlement}
      isMemberOfTenant={viewer.isMember || viewer.canManage}
      canManage={viewer.canManage}
      listHref={listHref}
      homeHref={homeHref}
    />
  );

  return model.templateId === "heritage" ?
      <HeritageDetailFrame>{detail}</HeritageDetailFrame>
    : detail;
}
