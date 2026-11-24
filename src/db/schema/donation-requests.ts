import { boolean, foreignKey, index, numeric, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { churches, users } from "./tenants";

export const donationRequests = pgTable(
  "donation_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    churchId: uuid("church_id").notNull(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    category: text("category").notNull(),
    reason: text("reason").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }),
    currency: text("currency").notNull().default("INR"),
    additionalInformation: text("additional_information").notNull().default(""),
    status: text("status").notNull().default("submitted"),
    memberResponse: text("member_response").notNull().default(""),
    reviewerId: uuid("reviewer_id").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: "date" }),
    campaignId: uuid("campaign_id"),
    acknowledged: boolean("acknowledged").notNull().default(false),
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.churchId, table.organizationId],
      foreignColumns: [churches.id, churches.organizationId],
      name: "donation_requests_church_organization_fk",
    }).onDelete("cascade"),
    uniqueIndex("donation_requests_idempotency_uidx").on(table.idempotencyKey),
    index("donation_requests_church_status_idx").on(table.churchId, table.status),
    index("donation_requests_member_idx").on(table.memberId, table.createdAt),
  ]
);

export const donationRequestEvents = pgTable(
  "donation_request_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => donationRequests.id, { onDelete: "cascade" }),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("donation_request_events_request_idx").on(table.requestId, table.createdAt)]
);
