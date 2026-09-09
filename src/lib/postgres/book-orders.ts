import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { bookOrders, books, users } from "@/db/schema";
import type { BookAdminScope } from "@/lib/books/admin-scope";
import type { UpdateFulfillmentInput } from "@/lib/books/validation";
import { isPostgresUuid } from "@/lib/postgres/uuid";
import type { BookOrderRecord } from "@/types/book";

function mapOrder(row: {
  order: typeof bookOrders.$inferSelect;
  bookTitle: string | null;
  buyerFirstName: string | null;
  buyerLastName: string | null;
  buyerEmail: string | null;
}): BookOrderRecord {
  const name = [row.buyerFirstName, row.buyerLastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return {
    id: row.order.id,
    organizationId: row.order.organizationId,
    churchId: row.order.churchId,
    bookId: row.order.bookId,
    bookTitle: row.bookTitle?.trim() || "Book",
    buyerUserId: row.order.buyerUserId,
    buyerName: name || row.order.shippingName,
    buyerEmail: row.buyerEmail,
    orderNumber: row.order.orderNumber,
    quantity: row.order.quantity,
    currency: row.order.currency,
    subtotalCents: row.order.subtotalCents,
    shippingCents: row.order.shippingCents,
    totalCents: row.order.totalCents,
    paymentStatus: row.order.paymentStatus,
    fulfillmentStatus: row.order.fulfillmentStatus,
    shippingName: row.order.shippingName,
    shippingPhone: row.order.shippingPhone,
    addressLine1: row.order.addressLine1,
    addressLine2: row.order.addressLine2,
    city: row.order.city,
    region: row.order.region,
    postalCode: row.order.postalCode,
    country: row.order.country,
    trackingNumber: row.order.trackingNumber,
    trackingUrl: row.order.trackingUrl,
    notes: row.order.notes,
    createdAt: row.order.createdAt.toISOString(),
    updatedAt: row.order.updatedAt.toISOString(),
  };
}

function orderJoins() {
  return db
    .select({
      order: bookOrders,
      bookTitle: books.title,
      buyerFirstName: users.firstName,
      buyerLastName: users.lastName,
      buyerEmail: users.email,
    })
    .from(bookOrders)
    .innerJoin(books, eq(books.id, bookOrders.bookId))
    .leftJoin(users, eq(users.id, bookOrders.buyerUserId));
}

function nextOrderNumber(): string {
  const now = new Date();
  const stamp = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = crypto.randomUUID().slice(0, 6).toUpperCase();
  return `BK-${stamp}-${rand}`;
}

export async function createBookOrder(input: {
  organizationId: string;
  churchId: string;
  bookId: string;
  buyerUserId: string;
  quantity: number;
  currency: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  shippingName: string;
  shippingPhone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  notes?: string | null;
}): Promise<BookOrderRecord> {
  const [created] = await db
    .insert(bookOrders)
    .values({
      organizationId: input.organizationId,
      churchId: input.churchId,
      bookId: input.bookId,
      buyerUserId: input.buyerUserId,
      orderNumber: nextOrderNumber(),
      quantity: input.quantity,
      currency: input.currency,
      subtotalCents: input.subtotalCents,
      shippingCents: input.shippingCents,
      totalCents: input.totalCents,
      paymentStatus: "pending",
      fulfillmentStatus: "pending",
      shippingName: input.shippingName,
      shippingPhone: input.shippingPhone,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2?.trim() || null,
      city: input.city,
      region: input.region,
      postalCode: input.postalCode,
      country: input.country,
      notes: input.notes?.trim() || null,
    })
    .returning();

  if (!created) throw new Error("Could not create the order.");
  const order = await getBookOrderById(created.id);
  if (!order) throw new Error("Could not load the created order.");
  return order;
}

export async function getBookOrderById(
  orderId: string
): Promise<BookOrderRecord | null> {
  if (!isPostgresUuid(orderId)) return null;
  const [row] = await orderJoins().where(eq(bookOrders.id, orderId)).limit(1);
  return row ? mapOrder(row) : null;
}

export async function listManagedBookOrders(
  scope: BookAdminScope
): Promise<BookOrderRecord[]> {
  const filters = [eq(bookOrders.organizationId, scope.organizationId)];
  if (scope.kind === "church") {
    if (scope.churchIds.length === 0) return [];
    filters.push(inArray(bookOrders.churchId, scope.churchIds));
  }

  const rows = await orderJoins()
    .where(and(...filters))
    .orderBy(desc(bookOrders.createdAt))
    .limit(300);

  return rows.map(mapOrder);
}

export async function updateBookOrderFulfillment(
  orderId: string,
  input: UpdateFulfillmentInput
): Promise<BookOrderRecord> {
  const patch: {
    fulfillmentStatus: UpdateFulfillmentInput["fulfillmentStatus"];
    trackingNumber: string | null;
    trackingUrl: string | null;
    notes?: string | null;
  } = {
    fulfillmentStatus: input.fulfillmentStatus,
    trackingNumber: input.trackingNumber?.trim() || null,
    trackingUrl: input.trackingUrl?.trim() || null,
  };
  if (input.notes !== undefined) {
    patch.notes = input.notes?.trim() || null;
  }

  await db.update(bookOrders).set(patch).where(eq(bookOrders.id, orderId));

  const order = await getBookOrderById(orderId);
  if (!order) throw new Error("Order not found.");
  return order;
}
