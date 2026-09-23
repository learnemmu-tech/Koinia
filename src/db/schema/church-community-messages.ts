import {
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { churches, users } from "./tenants";

export const churchCommunityMessages = pgTable(
  "church_community_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    churchId: uuid("church_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    replyToMessageId: uuid("reply_to_message_id"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    editedAt: timestamp("edited_at", { withTimezone: true, mode: "date" }),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
  },
  (table) => [
    foreignKey({
      columns: [table.churchId, table.organizationId],
      foreignColumns: [churches.id, churches.organizationId],
      name: "church_community_messages_church_organization_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.replyToMessageId],
      foreignColumns: [table.id],
      name: "church_community_messages_reply_to_fk",
    }).onDelete("set null"),
    index("church_community_messages_church_created_idx").on(
      table.churchId,
      table.createdAt
    ),
    index("church_community_messages_org_church_idx").on(
      table.organizationId,
      table.churchId
    ),
    index("church_community_messages_user_id_idx").on(table.userId),
    index("church_community_messages_deleted_at_idx").on(table.deletedAt),
    index("church_community_messages_reply_to_idx").on(table.replyToMessageId),
  ]
);

export const churchCommunityMessageReactions = pgTable(
  "church_community_message_reactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    churchId: uuid("church_id").notNull(),
    messageId: uuid("message_id")
      .notNull()
      .references(() => churchCommunityMessages.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reactionType: text("reaction_type").notNull().default("heart"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.churchId, table.organizationId],
      foreignColumns: [churches.id, churches.organizationId],
      name: "church_community_message_reactions_church_org_fk",
    }).onDelete("cascade"),
    unique("church_community_message_reactions_unique").on(
      table.messageId,
      table.userId,
      table.reactionType
    ),
    index("church_community_message_reactions_message_idx").on(table.messageId),
    index("church_community_message_reactions_church_idx").on(
      table.organizationId,
      table.churchId
    ),
  ]
);

export const churchCommunityMessageReports = pgTable(
  "church_community_message_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    churchId: uuid("church_id").notNull(),
    messageId: uuid("message_id")
      .notNull()
      .references(() => churchCommunityMessages.id, { onDelete: "cascade" }),
    reporterUserId: uuid("reporter_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.churchId, table.organizationId],
      foreignColumns: [churches.id, churches.organizationId],
      name: "church_community_message_reports_church_org_fk",
    }).onDelete("cascade"),
    unique("church_community_message_reports_unique").on(
      table.messageId,
      table.reporterUserId
    ),
    index("church_community_message_reports_message_idx").on(table.messageId),
    index("church_community_message_reports_church_idx").on(
      table.organizationId,
      table.churchId
    ),
  ]
);
