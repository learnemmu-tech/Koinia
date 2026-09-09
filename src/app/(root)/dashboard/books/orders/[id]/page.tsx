import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { BookOrderDetailAdmin } from "@/components/books/book-order-detail-admin";
import { resolveBookAdminScope, scopeAllowsBook } from "@/lib/books/admin-scope";
import { getBookOrderById } from "@/lib/postgres/book-orders";
import { adminSectionClass } from "@/lib/responsive-classes";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DashboardBookOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return null;

  const scope = await resolveBookAdminScope(userId);
  if (!scope) {
    return (
      <div className={adminSectionClass}>
        <p className="rounded-xl border border-border/50 bg-card/40 p-6 text-sm text-muted-foreground">
          You need organization admin or church admin access to view this order.
        </p>
      </div>
    );
  }

  const order = await getBookOrderById(id);
  if (!order || !scopeAllowsBook(scope, order)) notFound();

  return <BookOrderDetailAdmin initialOrder={order} />;
}
