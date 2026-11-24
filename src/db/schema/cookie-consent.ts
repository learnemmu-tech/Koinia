import { jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { users } from "./tenants";

export const cookieConsentEvents = pgTable(
  "cookie_consent_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    anonymousId: text("anonymous_id").notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    categories: jsonb("categories").notNull(),
    consentVersion: text("consent_version").notNull(),
    policyVersion: text("policy_version").notNull(),
    originHost: text("origin_host").notNull().default(""),
    locale: text("locale").notNull().default("en"),
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("cookie_consent_events_idempotency_uidx").on(table.idempotencyKey)]
);
