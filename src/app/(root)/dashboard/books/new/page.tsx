import { auth } from "@clerk/nextjs/server";

import { BookForm } from "@/components/books/book-form";
import { BooksListHeader } from "@/components/books/books-list-header";
import {
  listChurchesForBookAdmin,
  resolveBookAdminScope,
} from "@/lib/books/admin-scope";
import { adminSectionClass } from "@/lib/responsive-classes";

export default async function NewBookPage() {
  const { userId } = await auth();
  if (!userId) return null;
  const scope = await resolveBookAdminScope(userId);
  if (!scope) {
    return (
      <div className={adminSectionClass}>
        <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          You need organization admin or church admin access to create books.
        </p>
      </div>
    );
  }

  const churches = await listChurchesForBookAdmin(scope);
  if (churches.length === 0) {
    return (
      <div className={adminSectionClass}>
        <div className="mx-auto w-full max-w-3xl space-y-4">
          <BooksListHeader
            backHref="/dashboard/books"
            titleKey="createTitle"
            descriptionKey="formDescription"
          />
          <p className="text-sm text-muted-foreground">
            No church is available for publishing yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={adminSectionClass}>
      <BookForm churches={churches} />
    </div>
  );
}
