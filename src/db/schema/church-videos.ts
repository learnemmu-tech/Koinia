import { sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import {
  churchVideoProviderEnum,
  contentScopeEnum,
  shortCategoryEnum,
} from "./enums";
import { churches, users } from "./tenants";

export const churchVideos = pgTable(
  "church_videos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contentScope: contentScopeEnum("content_scope")
      .notNull()
      .default("organization"),
    organizationId: uuid("organization_id"),
    churchId: uuid("church_id"),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    externalUrl: text("external_url").notNull(),
    provider: churchVideoProviderEnum("provider").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    category: shortCategoryEnum("category").notNull().default("Other"),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    published: boolean("published").notNull().default(false),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
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
      name: "church_videos_church_organization_fk",
    }).onDelete("cascade"),
    index("church_videos_church_id_published_idx").on(
      table.churchId,
      table.published
    ),
    index("church_videos_organization_id_church_id_idx").on(
      table.organizationId,
      table.churchId
    ),
    index("church_videos_content_scope_idx").on(table.contentScope),
  ]
);
