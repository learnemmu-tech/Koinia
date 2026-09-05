import { sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { songCategoryEnum } from "./enums";
import { churches, users } from "./tenants";

export const songs = pgTable(
  "songs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    churchId: uuid("church_id").notNull(),
    songTitle: text("song_title").notNull(),
    alternateTitle: text("alternate_title"),
    artist: text("artist"),
    category: songCategoryEnum("category").notNull().default("Worship"),
    originalLyrics: text("original_lyrics").notNull().default(""),
    translationLyrics: text("translation_lyrics"),
    scriptureReference: text("scripture_reference"),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    featured: boolean("featured").notNull().default(false),
    published: boolean("published").notNull().default(true),
    imageUrl: text("image_url"),
    audioUrl: text("audio_url"),
    youtubeUrl: text("youtube_url"),
    playCount: integer("play_count").notNull().default(0),
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
  },
  (table) => [
    foreignKey({
      columns: [table.churchId, table.organizationId],
      foreignColumns: [churches.id, churches.organizationId],
      name: "songs_church_organization_fk",
    }).onDelete("cascade"),
    index("songs_church_id_created_at_idx").on(table.churchId, table.createdAt),
    index("songs_organization_id_church_id_idx").on(
      table.organizationId,
      table.churchId
    ),
    index("songs_church_id_published_idx").on(table.churchId, table.published),
  ]
);

export const sermons = pgTable(
  "sermons",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    churchId: uuid("church_id").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    scriptureReference: text("scripture_reference").notNull().default(""),
    speaker: text("speaker").notNull().default(""),
    shortDescription: text("short_description").notNull().default(""),
    content: text("content").notNull().default(""),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    youtubeUrl: text("youtube_url"),
    audioUrl: text("audio_url"),
    coverImage: text("cover_image"),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    isPublished: boolean("is_published").notNull().default(false),
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
      name: "sermons_church_organization_fk",
    }).onDelete("cascade"),
    index("sermons_church_id_created_at_idx").on(
      table.churchId,
      table.createdAt
    ),
    index("sermons_organization_id_church_id_idx").on(
      table.organizationId,
      table.churchId
    ),
    index("sermons_church_id_is_published_idx").on(
      table.churchId,
      table.isPublished
    ),
  ]
);

export const articles = pgTable(
  "articles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    churchId: uuid("church_id").notNull(),
    title: text("title").notNull(),
    category: text("category").notNull().default("Christian Living"),
    shortDescription: text("short_description").notNull().default(""),
    scriptureReference: text("scripture_reference"),
    content: text("content").notNull().default(""),
    coverImage: text("cover_image"),
    author: text("author").notNull().default(""),
    authorImage: text("author_image"),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    youtubeUrl: text("youtube_url"),
    featured: boolean("featured").notNull().default(false),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    isPublished: boolean("is_published").notNull().default(false),
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
      name: "articles_church_organization_fk",
    }).onDelete("cascade"),
    index("articles_church_id_created_at_idx").on(
      table.churchId,
      table.createdAt
    ),
    index("articles_organization_id_church_id_idx").on(
      table.organizationId,
      table.churchId
    ),
    index("articles_church_id_is_published_idx").on(
      table.churchId,
      table.isPublished
    ),
  ]
);
