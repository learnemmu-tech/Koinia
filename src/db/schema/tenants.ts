import { sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import {
  churchMembershipRoleEnum,
  churchMembershipStatusEnum,
  enrollmentModeEnum,
  organizationMembershipRoleEnum,
  organizationMembershipStatusEnum,
  organizationStatusEnum,
  platformRoleEnum,
  workspaceTypeEnum,
} from "./enums";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkId: text("clerk_id").unique(),
    email: text("email").notNull().unique(),
    emailVerifiedAt: timestamp("email_verified_at", {
      withTimezone: true,
      mode: "date",
    }),
    firstName: text("first_name").notNull().default(""),
    lastName: text("last_name").notNull().default(""),
    platformRole: platformRoleEnum("platform_role").notNull().default("user"),
    organizationId: uuid("organization_id").references(
      (): AnyPgColumn => organizations.id,
      { onDelete: "set null" }
    ),
    activeChurchId: uuid("active_church_id").references(
      (): AnyPgColumn => churches.id,
      { onDelete: "set null" }
    ),
    pendingChurchId: uuid("pending_church_id").references(
      (): AnyPgColumn => churches.id,
      { onDelete: "set null" }
    ),
    needsChurchOnboarding: boolean("needs_church_onboarding")
      .notNull()
      .default(true),
    onboardingCompletedAt: timestamp("onboarding_completed_at", {
      withTimezone: true,
      mode: "date",
    }),
    emailPreferences: jsonb("email_preferences")
      .notNull()
      .default(
        sql`'{"song":true,"sermon":true,"article":true,"event":true,"donation":true,"prayer":true}'::jsonb`
      ),
    ...timestamps,
  },
  (table) => [
    index("users_organization_id_idx").on(table.organizationId),
    index("users_active_church_id_idx").on(table.activeChurchId),
    index("users_pending_church_id_idx").on(table.pendingChurchId),
    index("users_created_at_idx").on(table.createdAt),
  ]
);

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    logoUrl: text("logo_url"),
    description: text("description"),
    ownerId: uuid("owner_id")
      .notNull()
      .references((): AnyPgColumn => users.id, { onDelete: "restrict" }),
    status: organizationStatusEnum("status").notNull().default("active"),
    workspaceType: workspaceTypeEnum("workspace_type")
      .notNull()
      .default("independent_church"),
    settings: jsonb("settings").notNull().default(sql`'{}'::jsonb`),
    ...timestamps,
  },
  (table) => [
    index("organizations_owner_id_idx").on(table.ownerId),
    index("organizations_workspace_type_idx").on(table.workspaceType),
  ]
);

export const churches = pgTable(
  "churches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    joinSlug: text("join_slug").notNull().unique(),
    retiredJoinSlugs: text("retired_join_slugs")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    enrollmentMode: enrollmentModeEnum("enrollment_mode")
      .notNull()
      .default("approval_required"),
    joinUrlEnabled: boolean("join_url_enabled").notNull().default(true),
    isActive: boolean("is_active").notNull().default(true),
    description: text("description"),
    logoUrl: text("logo_url"),
    bannerUrl: text("banner_url"),
    address: text("address"),
    city: text("city"),
    state: text("state"),
    country: text("country"),
    phone: text("phone"),
    email: text("email"),
    website: text("website"),
    pastorName: text("pastor_name"),
    establishedYear: integer("established_year"),
    timezone: text("timezone"),
    currency: text("currency").default("USD"),
    denomination: text("denomination"),
    churchType: text("church_type"),
    defaultLanguage: text("default_language"),
    showDonations: boolean("show_donations").notNull().default(true),
    showEvents: boolean("show_events").notNull().default(true),
    showPrayerWall: boolean("show_prayer_wall").notNull().default(true),
    primaryColor: text("primary_color"),
    secondaryColor: text("secondary_color"),
    welcomeMessage: text("welcome_message"),
    ...timestamps,
  },
  (table) => [
    unique("churches_id_organization_id_unique").on(
      table.id,
      table.organizationId
    ),
    unique("churches_organization_id_slug_unique").on(
      table.organizationId,
      table.slug
    ),
    index("churches_organization_id_idx").on(table.organizationId),
    index("churches_is_active_idx").on(table.isActive),
    index("churches_retired_join_slugs_idx").using(
      "gin",
      table.retiredJoinSlugs
    ),
  ]
);

export const organizationMemberships = pgTable(
  "organization_memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: organizationMembershipRoleEnum("role").notNull(),
    status: organizationMembershipStatusEnum("status")
      .notNull()
      .default("active"),
    ...timestamps,
  },
  (table) => [
    unique("organization_memberships_org_user_unique").on(
      table.organizationId,
      table.userId
    ),
    index("organization_memberships_user_id_status_idx").on(
      table.userId,
      table.status
    ),
    index("organization_memberships_organization_id_idx").on(
      table.organizationId
    ),
  ]
);

export const churchMemberships = pgTable(
  "church_memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    churchId: uuid("church_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: churchMembershipRoleEnum("role").notNull().default("member"),
    status: churchMembershipStatusEnum("status").notNull().default("pending"),
    ...timestamps,
  },
  (table) => [
    unique("church_memberships_church_user_unique").on(
      table.churchId,
      table.userId
    ),
    foreignKey({
      columns: [table.churchId, table.organizationId],
      foreignColumns: [churches.id, churches.organizationId],
      name: "church_memberships_church_organization_fk",
    }).onDelete("cascade"),
    index("church_memberships_user_id_status_idx").on(
      table.userId,
      table.status
    ),
    index("church_memberships_church_id_status_idx").on(
      table.churchId,
      table.status
    ),
    index("church_memberships_organization_id_user_id_idx").on(
      table.organizationId,
      table.userId
    ),
  ]
);
