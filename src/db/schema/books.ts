import {
  boolean,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import {
  bookDigitalAccessModeEnum,
  bookDigitalEntitlementSourceEnum,
  bookOrderFulfillmentStatusEnum,
  bookOrderPaymentStatusEnum,
  bookStatusEnum,
  bookTypeEnum,
  bookVisibilityEnum,
} from "./enums";
import { churches, users } from "./tenants";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const books = pgTable(
  "books",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    churchId: uuid("church_id").notNull(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    authorName: text("author_name").notNull(),
    description: text("description").notNull().default(""),
    coverImageUrl: text("cover_image_url"),
    status: bookStatusEnum("status").notNull().default("draft"),
    visibility: bookVisibilityEnum("visibility").notNull().default("public"),
    bookType: bookTypeEnum("book_type").notNull(),
    language: text("language").notNull().default("en"),
    currency: text("currency").notNull().default("USD"),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [
    foreignKey({
      columns: [table.churchId, table.organizationId],
      foreignColumns: [churches.id, churches.organizationId],
      name: "books_church_organization_fk",
    }).onDelete("cascade"),
    unique("books_organization_id_slug_unique").on(
      table.organizationId,
      table.slug
    ),
    index("books_organization_id_church_id_idx").on(
      table.organizationId,
      table.churchId
    ),
    index("books_church_id_status_idx").on(table.churchId, table.status),
    index("books_status_visibility_idx").on(table.status, table.visibility),
    index("books_created_at_idx").on(table.createdAt),
  ]
);

export const bookDigitalEditions = pgTable(
  "book_digital_editions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    fileObjectKey: text("file_object_key"),
    fileName: text("file_name"),
    fileSize: integer("file_size"),
    mimeType: text("mime_type"),
    pageCount: integer("page_count"),
    accessMode: bookDigitalAccessModeEnum("access_mode")
      .notNull()
      .default("free"),
    priceCents: integer("price_cents").notNull().default(0),
    currency: text("currency").notNull().default("USD"),
    ...timestamps,
  },
  (table) => [
    unique("book_digital_editions_book_id_unique").on(table.bookId),
    index("book_digital_editions_access_mode_idx").on(table.accessMode),
  ]
);

export const bookPhysicalEditions = pgTable(
  "book_physical_editions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    priceCents: integer("price_cents").notNull().default(0),
    currency: text("currency").notNull().default("USD"),
    stockQuantity: integer("stock_quantity").notNull().default(0),
    sku: text("sku"),
    weightGrams: integer("weight_grams"),
    shippingAvailable: boolean("shipping_available").notNull().default(true),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    unique("book_physical_editions_book_id_unique").on(table.bookId),
    index("book_physical_editions_is_active_idx").on(table.isActive),
  ]
);

export const bookDigitalEntitlements = pgTable(
  "book_digital_entitlements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    source: bookDigitalEntitlementSourceEnum("source")
      .notNull()
      .default("grant"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("book_digital_entitlements_book_user_unique").on(
      table.bookId,
      table.userId
    ),
    index("book_digital_entitlements_user_id_idx").on(table.userId),
  ]
);

export const bookOrders = pgTable(
  "book_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    churchId: uuid("church_id").notNull(),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "restrict" }),
    buyerUserId: uuid("buyer_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    orderNumber: text("order_number").notNull(),
    quantity: integer("quantity").notNull().default(1),
    currency: text("currency").notNull(),
    subtotalCents: integer("subtotal_cents").notNull(),
    shippingCents: integer("shipping_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    paymentStatus: bookOrderPaymentStatusEnum("payment_status")
      .notNull()
      .default("pending"),
    fulfillmentStatus: bookOrderFulfillmentStatusEnum("fulfillment_status")
      .notNull()
      .default("pending"),
    shippingName: text("shipping_name").notNull(),
    shippingPhone: text("shipping_phone").notNull(),
    addressLine1: text("address_line1").notNull(),
    addressLine2: text("address_line2"),
    city: text("city").notNull(),
    region: text("region").notNull(),
    postalCode: text("postal_code").notNull(),
    country: text("country").notNull(),
    trackingNumber: text("tracking_number"),
    trackingUrl: text("tracking_url"),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    foreignKey({
      columns: [table.churchId, table.organizationId],
      foreignColumns: [churches.id, churches.organizationId],
      name: "book_orders_church_organization_fk",
    }).onDelete("cascade"),
    unique("book_orders_order_number_unique").on(table.orderNumber),
    index("book_orders_organization_id_created_at_idx").on(
      table.organizationId,
      table.createdAt
    ),
    index("book_orders_church_id_created_at_idx").on(
      table.churchId,
      table.createdAt
    ),
    index("book_orders_book_id_idx").on(table.bookId),
    index("book_orders_buyer_user_id_idx").on(table.buyerUserId),
    index("book_orders_payment_status_idx").on(table.paymentStatus),
    index("book_orders_fulfillment_status_idx").on(table.fulfillmentStatus),
  ]
);
