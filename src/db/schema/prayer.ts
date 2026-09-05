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
  prayerRequestCategoryEnum,
  prayerRequestStatusEnum,
} from "./enums";
import { churches, users } from "./tenants";

export const prayerRequests = pgTable(
  "prayer_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    churchId: uuid("church_id").notNull(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    email: text("email"),
    title: text("title").notNull(),
    request: text("request").notNull(),
    category: prayerRequestCategoryEnum("category")
      .notNull()
      .default("general"),
    isAnonymous: boolean("is_anonymous").notNull().default(false),
    shareWithCommunity: boolean("share_with_community").notNull().default(true),
    isAnswered: boolean("is_answered").notNull().default(false),
    answeredAt: timestamp("answered_at", {
      withTimezone: true,
      mode: "date",
    }),
    status: prayerRequestStatusEnum("status").notNull().default("pending"),
    prayerCount: integer("prayer_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    foreignKey({
      columns: [table.churchId, table.organizationId],
      foreignColumns: [churches.id, churches.organizationId],
      name: "prayer_requests_church_organization_fk",
    }).onDelete("cascade"),
    index("prayer_requests_church_id_created_at_idx").on(
      table.churchId,
      table.createdAt
    ),
    index("prayer_requests_church_id_status_created_at_idx").on(
      table.churchId,
      table.status,
      table.createdAt
    ),
    index("prayer_requests_user_id_created_at_idx").on(
      table.userId,
      table.createdAt
    ),
    index("prayer_requests_organization_id_church_id_idx").on(
      table.organizationId,
      table.churchId
    ),
  ]
);

export const prayerIntercessions = pgTable(
  "prayer_intercessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    prayerRequestId: uuid("prayer_request_id")
      .notNull()
      .references(() => prayerRequests.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("prayer_intercessions_request_user_unique").on(
      table.prayerRequestId,
      table.userId
    ),
    index("prayer_intercessions_user_id_idx").on(table.userId),
  ]
);
