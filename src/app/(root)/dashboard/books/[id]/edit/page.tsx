import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { BookForm } from "@/components/books/book-form";
import {
  listChurchesForBookAdmin,
  resolveBookAdminScope,
  scopeAllowsBook,
} from "@/lib/books/admin-scope";
import { getBookById } from "@/lib/postgres/books";
import { adminSectionClass } from "@/lib/responsive-classes";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditBookPage({ params }: PageProps) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return null;

  const scope = await resolveBookAdminScope(userId);
  if (!scope) {
    return (
      <div className={adminSectionClass}>
        <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          You need organization admin or church admin access to edit books.
        </p>
      </div>
    );
  }

  const [book, churches] = await Promise.all([
    getBookById(id),
    listChurchesForBookAdmin(scope),
  ]);
  if (!book || !scopeAllowsBook(scope, book)) notFound();

  return (
    <div className={adminSectionClass}>
      <BookForm book={book} churches={churches} />
    </div>
  );
}
