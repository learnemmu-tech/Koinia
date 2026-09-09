import { auth } from "@clerk/nextjs/server";

import { BookOrdersAdminPageClient } from "@/components/books/book-orders-admin-page";
import { resolveBookAdminScope } from "@/lib/books/admin-scope";
import { listManagedBookOrders } from "@/lib/postgres/book-orders";
import { adminSectionClass } from "@/lib/responsive-classes";

export default async function DashboardBookOrdersPage() {
  const { userId } = await auth();
  if (!userId) return null;
  const scope = await resolveBookAdminScope(userId);
  if (!scope) {
    return (
      <div className={adminSectionClass}>
        <p className="rounded-xl border border-border/50 bg-card/40 p-6 text-sm text-muted-foreground">
          You need organization admin or church admin access to view book orders.
        </p>
      </div>
    );
  }

  const orders = await listManagedBookOrders(scope);
  return <BookOrdersAdminPageClient initialOrders={orders} />;
}
