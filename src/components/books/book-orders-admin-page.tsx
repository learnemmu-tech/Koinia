"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminToolbar } from "@/components/admin/admin-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/books/currency";
import { adminSectionClass } from "@/lib/responsive-classes";
import type { BookOrderRecord } from "@/types/book";

export function BookOrdersAdminPageClient({
  initialOrders,
}: {
  initialOrders: BookOrderRecord[];
}) {
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return initialOrders;
    return initialOrders.filter((order) =>
      [
        order.orderNumber,
        order.bookTitle,
        order.buyerName,
        order.buyerEmail,
        order.shippingName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [initialOrders, search]);

  return (
    <div className={adminSectionClass}>
      <AdminPageHeader
        eyebrow="Resources"
        title="Book orders"
        description="Track physical book orders and fulfillment for your church."
      >
        <Button asChild size="sm" variant="outline" className="rounded-full">
          <Link href="/dashboard/books">Back to books</Link>
        </Button>
      </AdminPageHeader>

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search order, book, or customer…"
      />

      {visible.length === 0 ?
        <div className="rounded-xl border border-dashed border-border/70 px-4 py-16 text-center text-sm text-muted-foreground">
          No physical book orders yet.
        </div>
      : <div className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/50 bg-card/40">
          {visible.map((order) => (
            <Link
              key={order.id}
              href={`/dashboard/books/orders/${order.id}`}
              className="flex min-w-0 flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{order.orderNumber}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {order.bookTitle} · {order.buyerName || order.shippingName}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span>{order.quantity} qty</span>
                <span className="font-medium">
                  {formatMoney(order.totalCents, order.currency)}
                </span>
                <Badge variant="secondary" className="capitalize">
                  {order.paymentStatus}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {order.fulfillmentStatus}
                </Badge>
                <span className="text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      }
    </div>
  );
}
