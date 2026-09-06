import {
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { shortCategoryEnum, shortVisibilityEnum } from "./enums";
import { churches, users } from "./tenants";

export const videoShorts = pgTable(
  "video_shorts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    churchId: uuid("church_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    videoUrl: text("video_url"),
    thumbnailUrl: text("thumbnail_url"),
    caption: text("caption").notNull().default(""),
    category: shortCategoryEnum("category").notNull().default("Other"),
    duration: integer("duration"),
    visibility: shortVisibilityEnum("visibility").notNull().default("church"),
    viewCount: integer("view_count").notNull().default(0),
    likeCount: integer("like_count").notNull().default(0),
    commentCount: integer("comment_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    publishedAt: timestamp("published_at", {
      withTimezone: true,
      mode: "date",
    }),
  },
  (table) => [
    foreignKey({
      columns: [table.churchId, table.organizationId],
      foreignColumns: [churches.id, churches.organizationId],
      name: "video_shorts_church_organization_fk",
    }).onDelete("cascade"),
    index("video_shorts_church_id_published_at_idx").on(
      table.churchId,
      table.publishedAt
    ),
    index("video_shorts_organization_id_church_id_idx").on(
      table.organizationId,
      table.churchId
    ),
    index("video_shorts_user_id_idx").on(table.userId),
    index("video_shorts_visibility_idx").on(table.visibility),
    index("video_shorts_created_at_idx").on(table.createdAt),
  ]
);

export const videoShortLikes = pgTable(
  "video_short_likes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shortId: uuid("short_id")
      .notNull()
      .references(() => videoShorts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("video_short_likes_short_user_unique").on(table.shortId, table.userId),
    index("video_short_likes_short_id_idx").on(table.shortId),
  ]
);

export const videoShortComments = pgTable(
  "video_short_comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shortId: uuid("short_id")
      .notNull()
      .references(() => videoShorts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Null for a top-level comment, otherwise the comment being replied to. */
    parentId: uuid("parent_id"),
    body: text("body").notNull(),
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
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "video_short_comments_parent_id_fk",
    }).onDelete("cascade"),
    index("video_short_comments_short_id_created_at_idx").on(
      table.shortId,
      table.createdAt
    ),
    index("video_short_comments_parent_id_idx").on(table.parentId),
  ]
);

export const videoShortReports = pgTable(
  "video_short_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shortId: uuid("short_id")
      .notNull()
      .references(() => videoShorts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("video_short_reports_short_user_unique").on(table.shortId, table.userId),
    index("video_short_reports_short_id_idx").on(table.shortId),
  ]
);
