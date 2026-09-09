"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { updateOrderFulfillment } from "@/lib/books/books-client";
import { formatMoney } from "@/lib/books/currency";
import { updateFulfillmentSchema } from "@/lib/books/validation";
import { adminSectionClass } from "@/lib/responsive-classes";
import type { BookOrderFulfillmentStatus, BookOrderRecord } from "@/types/book";

const NEXT_STATUS: Record<
  BookOrderFulfillmentStatus,
  BookOrderFulfillmentStatus | null
> = {
  pending: "processing",
  processing: "shipped",
  shipped: "delivered",
  delivered: null,
  cancelled: null,
};

export function BookOrderDetailAdmin({
  initialOrder,
}: {
  initialOrder: BookOrderRecord;
}) {
  const { user } = useFirebaseAuth();
  const [order, setOrder] = useState(initialOrder);
  const [saving, setSaving] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber ?? "");
  const [trackingUrl, setTrackingUrl] = useState(order.trackingUrl ?? "");
  const nextStatus = NEXT_STATUS[order.fulfillmentStatus];

  async function saveFulfillment(
    fulfillmentStatus: BookOrderFulfillmentStatus
  ) {
    if (!user) {
      toast.error("Please sign in.");
      return;
    }
    const parsed = updateFulfillmentSchema.safeParse({
      fulfillmentStatus,
      trackingNumber: trackingNumber.trim() || null,
      trackingUrl: trackingUrl.trim() || null,
      notes: order.notes,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Could not update fulfillment.");
      return;
    }

    setSaving(true);
    try {
      const token = await user.getIdToken();
      const result = await updateOrderFulfillment(token, order.id, parsed.data);
      setOrder(result.order);
      toast.success("Fulfillment updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the order.");
    } finally {
      setSaving(false);
    }
  }

  async function onAdvance(event: FormEvent) {
    event.preventDefault();
    if (!nextStatus) return;
    await saveFulfillment(nextStatus);
  }

  return (
    <div className={adminSectionClass}>
      <AdminPageHeader
        eyebrow="Resources"
        title={order.orderNumber}
        description="Physical book order details and fulfillment."
      >
        <Button asChild size="sm" variant="outline" className="rounded-full">
          <Link href="/dashboard/books/orders">All orders</Link>
        </Button>
      </AdminPageHeader>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="space-y-3 rounded-xl border border-border/50 bg-card/40 p-4">
          <h2 className="text-sm font-semibold">Customer</h2>
          <p className="text-sm">{order.buyerName || order.shippingName}</p>
          {order.buyerEmail ?
            <p className="text-xs text-muted-foreground">{order.buyerEmail}</p>
          : null}
          <p className="text-sm text-muted-foreground">{order.shippingPhone}</p>
          <address className="not-italic text-sm text-muted-foreground">
            {order.addressLine1}
            {order.addressLine2 ? <><br />{order.addressLine2}</> : null}
            <br />
            {order.city}, {order.region} {order.postalCode}
            <br />
            {order.country}
          </address>
        </section>

        <section className="space-y-3 rounded-xl border border-border/50 bg-card/40 p-4">
          <h2 className="text-sm font-semibold">Order</h2>
          <p className="text-sm font-medium">{order.bookTitle}</p>
          <dl className="grid gap-1 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Quantity</dt>
              <dd>{order.quantity}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Total</dt>
              <dd>{formatMoney(order.totalCents, order.currency)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Payment</dt>
              <dd>
                <Badge variant="secondary" className="capitalize">
                  {order.paymentStatus}
                </Badge>
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Fulfillment</dt>
              <dd>
                <Badge variant="outline" className="capitalize">
                  {order.fulfillmentStatus}
                </Badge>
              </dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground">
            Payment providers are not connected yet. Do not treat pending as paid.
          </p>
        </section>
      </div>

      <form
        onSubmit={onAdvance}
        className="space-y-4 rounded-xl border border-border/50 bg-card/40 p-4"
      >
        <h2 className="text-sm font-semibold">Fulfillment</h2>
        {(nextStatus === "shipped" ||
          order.fulfillmentStatus === "shipped" ||
          order.fulfillmentStatus === "delivered") && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="tracking-number">Tracking number</Label>
              <Input
                id="tracking-number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                required={nextStatus === "shipped"}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tracking-url">Tracking URL</Label>
              <Input
                id="tracking-url"
                type="url"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="https://"
              />
            </div>
          </div>
        )}
        {order.trackingNumber ?
          <p className="text-xs text-muted-foreground">
            Tracking: {order.trackingNumber}
            {order.trackingUrl ?
              <>
                {" · "}
                <a
                  href={order.trackingUrl}
                  className="underline underline-offset-2"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open tracking
                </a>
              </>
            : null}
          </p>
        : null}
        {nextStatus ?
          <Button type="submit" disabled={saving}>
            {saving ?
              "Updating…"
            : `Mark as ${nextStatus}`}
          </Button>
        : <p className="text-sm text-muted-foreground">
            This order is {order.fulfillmentStatus}.
          </p>
        }
      </form>
    </div>
  );
}
