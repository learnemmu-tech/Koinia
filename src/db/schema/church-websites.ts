import { sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { churches, organizations } from "./tenants";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const churchWebsites = pgTable(
  "church_websites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    churchId: uuid("church_id").notNull(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    activeTemplate: text("active_template").notNull().default("signature"),
    siteTitle: text("site_title"),
    metaDescription: text("meta_description"),
    faviconUrl: text("favicon_url"),
    ogImageUrl: text("og_image_url"),
    canonicalUrl: text("canonical_url"),
    indexable: boolean("indexable").notNull().default(true),
    logoUrl: text("logo_url"),
    heroImageUrl: text("hero_image_url"),
    aboutImageUrl: text("about_image_url"),
    featuredMinistryImageUrl: text("featured_ministry_image_url"),
    worshipImageUrl: text("worship_image_url"),
    socialPreviewImageUrl: text("social_preview_image_url"),
    heroEyebrow: text("hero_eyebrow"),
    heroHeadline: text("hero_headline"),
    heroSubheadline: text("hero_subheadline"),
    scriptureReference: text("scripture_reference"),
    scriptureText: text("scripture_text"),
    serviceLabel: text("service_label"),
    serviceTime: text("service_time"),
    serviceLocation: text("service_location"),
    aboutHeadline: text("about_headline"),
    aboutIntro: text("about_intro"),
    aboutMission: text("about_mission"),
    aboutVision: text("about_vision"),
    aboutCommunity: text("about_community"),
    aboutValues: jsonb("about_values")
      .$type<Array<{ title: string; body: string }>>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    aboutBeliefs: jsonb("about_beliefs")
      .$type<Array<{ title: string; body: string }>>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    socialLinks: jsonb("social_links")
      .$type<Record<string, string>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    visibility: jsonb("visibility")
      .$type<Record<string, boolean>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    websiteSetupCompletedAt: timestamp("website_setup_completed_at", {
      withTimezone: true,
      mode: "date",
    }),
    ...timestamps,
  },
  (table) => [
    unique("church_websites_church_id_unique").on(table.churchId),
    unique("church_websites_church_organization_unique").on(
      table.churchId,
      table.organizationId
    ),
    foreignKey({
      columns: [table.churchId, table.organizationId],
      foreignColumns: [churches.id, churches.organizationId],
      name: "church_websites_church_organization_fk",
    }).onDelete("cascade"),
    index("church_websites_organization_id_idx").on(table.organizationId),
    index("church_websites_active_template_idx").on(table.activeTemplate),
    index("church_websites_setup_completed_idx").on(table.websiteSetupCompletedAt),
  ]
);
