import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";

import { BooksAdminBar } from "@/components/books/books-admin-bar";
import { BooksCatalog } from "@/components/books/books-catalog";
import { BooksListHeader } from "@/components/books/books-list-header";
import {
  listCatalogMemberChurchIds,
  resolveBookAdminScope,
} from "@/lib/books/admin-scope";
import { listPublishedCatalogBooks } from "@/lib/postgres/books";
import { pageContentClass } from "@/lib/responsive-classes";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = buildPageMetadata({
  title: "Christian Books & Ministry Resources",
  description:
    "Discover published Christian books and ministry resources from churches on FaithConnectHub.",
  path: "/books",
  keywords: ["Christian books", "ministry resources", "church books", "digital books"],
});

export default async function BooksPage() {
  const { userId } = await auth();
  const [memberChurchIds, adminScope] = await Promise.all([
    listCatalogMemberChurchIds(userId),
    userId ? resolveBookAdminScope(userId) : Promise.resolve(null),
  ]);
  const books = await listPublishedCatalogBooks({
    includeMembersOnlyForChurchIds: memberChurchIds,
  });

  return (
    <section className={pageContentClass} aria-labelledby="books-heading">
      <BooksListHeader
        headingId="books-heading"
        action={<BooksAdminBar canManage={Boolean(adminScope)} />}
      />
      <BooksCatalog books={books} canManage={Boolean(adminScope)} />
    </section>
  );
}
