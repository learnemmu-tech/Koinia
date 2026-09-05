import {
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { notificationTypeEnum } from "./enums";
import { churches, users } from "./tenants";

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    churchId: uuid("church_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    contentTitle: text("content_title").notNull().default(""),
    image: text("image"),
    contentId: uuid("content_id"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.churchId, table.organizationId],
      foreignColumns: [churches.id, churches.organizationId],
      name: "notifications_church_organization_fk",
    }).onDelete("cascade"),
    index("notifications_user_id_created_at_idx").on(
      table.userId,
      table.createdAt
    ),
    index("notifications_church_id_created_at_idx").on(
      table.churchId,
      table.createdAt
    ),
  ]
);

export const notificationReads = pgTable(
  "notification_reads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    notificationId: uuid("notification_id")
      .notNull()
      .references(() => notifications.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    readAt: timestamp("read_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("notification_reads_notification_user_unique").on(
      table.notificationId,
      table.userId
    ),
    index("notification_reads_user_id_idx").on(table.userId),
  ]
);
