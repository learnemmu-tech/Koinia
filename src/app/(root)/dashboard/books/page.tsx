import { auth } from "@clerk/nextjs/server";

import { BooksAdminPageClient } from "@/components/books/books-admin-page";
import { resolveBookAdminScope } from "@/lib/books/admin-scope";
import { listManagedBooks } from "@/lib/postgres/books";
import { adminSectionClass } from "@/lib/responsive-classes";

export default async function DashboardBooksPage() {
  const { userId } = await auth();
  if (!userId) return null;
  const scope = await resolveBookAdminScope(userId);
  if (!scope) {
    return (
      <div className={adminSectionClass}>
        <p className="rounded-xl border border-border/50 bg-card/40 p-6 text-sm text-muted-foreground">
          You need organization admin or church admin access to manage books.
        </p>
      </div>
    );
  }

  const books = await listManagedBooks(scope);

  return <BooksAdminPageClient initialBooks={books} />;
}
