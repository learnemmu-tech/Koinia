import {
  boolean,
  foreignKey,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { users } from "./tenants";

export const legalDocumentVersions = pgTable(
  "legal_document_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    versionLabel: text("version_label").notNull(),
    reviewStatus: text("review_status").notNull(),
    locale: text("locale").notNull().default("en"),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    sections: jsonb("sections").notNull(),
    materialChange: boolean("material_change").notNull().default(false),
    changeSummary: text("change_summary").notNull().default(""),
    effectiveOn: timestamp("effective_on", { withTimezone: true, mode: "date" }),
    publishedAt: timestamp("published_at", { withTimezone: true, mode: "date" }),
    approvedByUserId: uuid("approved_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    approverName: text("approver_name"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("legal_document_versions_slug_label_uidx").on(
      table.slug,
      table.versionLabel
    ),
    index("legal_document_versions_slug_status_idx").on(
      table.slug,
      table.reviewStatus
    ),
  ]
);

export const legalAcceptances = pgTable(
  "legal_acceptances",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    versionId: uuid("version_id")
      .notNull()
      .references(() => legalDocumentVersions.id, { onDelete: "restrict" }),
    action: text("action").notNull(),
    locale: text("locale").notNull().default("en"),
    source: text("source").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("legal_acceptances_idempotency_uidx").on(table.idempotencyKey),
    index("legal_acceptances_user_idx").on(table.userId, table.createdAt),
  ]
);

export const consentPreferences = pgTable(
  "consent_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    purpose: text("purpose").notNull(),
    granted: boolean("granted").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("consent_preferences_user_purpose_uidx").on(
      table.userId,
      table.purpose
    ),
  ]
);

export const privacyRequests = pgTable(
  "privacy_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    requestType: text("request_type").notNull(),
    details: text("details").notNull().default(""),
    status: text("status").notNull().default("submitted"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("privacy_requests_user_idx").on(table.userId, table.createdAt)]
);

export const privacyRequestEvents = pgTable(
  "privacy_request_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => privacyRequests.id, { onDelete: "cascade" }),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    status: text("status").notNull(),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.requestId],
      foreignColumns: [privacyRequests.id],
      name: "privacy_request_events_request_fk",
    }),
    index("privacy_request_events_request_idx").on(table.requestId),
  ]
);

export const legalReviewEvents = pgTable("legal_review_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull(),
  versionId: uuid("version_id").references(() => legalDocumentVersions.id, {
    onDelete: "set null",
  }),
  actorUserId: uuid("actor_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  action: text("action").notNull(),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});
