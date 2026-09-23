import { sql } from "drizzle-orm";
import {
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import {
  churchGroupInvitationStatusEnum,
  churchGroupMemberRoleEnum,
  churchGroupStatusEnum,
} from "./enums";
import { churches, users } from "./tenants";

export const churchGroups = pgTable(
  "church_groups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    churchId: uuid("church_id").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    imageUrl: text("image_url"),
    inviteToken: text("invite_token").notNull().unique(),
    status: churchGroupStatusEnum("status").notNull().default("active"),
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
      name: "church_groups_church_organization_fk",
    }).onDelete("cascade"),
    index("church_groups_organization_id_idx").on(table.organizationId),
    index("church_groups_church_id_status_idx").on(table.churchId, table.status),
  ]
);

export const churchGroupMemberships = pgTable(
  "church_group_memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    churchId: uuid("church_id").notNull(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => churchGroups.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: churchGroupMemberRoleEnum("role").notNull().default("member"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("church_group_memberships_group_user_unique").on(
      table.groupId,
      table.userId
    ),
    foreignKey({
      columns: [table.churchId, table.organizationId],
      foreignColumns: [churches.id, churches.organizationId],
      name: "church_group_memberships_church_organization_fk",
    }).onDelete("cascade"),
    index("church_group_memberships_user_id_idx").on(table.userId),
    index("church_group_memberships_organization_id_idx").on(
      table.organizationId
    ),
  ]
);

export const churchGroupInvitations = pgTable(
  "church_group_invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    churchId: uuid("church_id").notNull(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => churchGroups.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    invitedBy: uuid("invited_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: churchGroupInvitationStatusEnum("status")
      .notNull()
      .default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    respondedAt: timestamp("responded_at", {
      withTimezone: true,
      mode: "date",
    }),
  },
  (table) => [
    uniqueIndex("church_group_invitations_pending_group_user_unique")
      .on(table.groupId, table.userId)
      .where(sql`${table.status} = 'pending'`),
    foreignKey({
      columns: [table.churchId, table.organizationId],
      foreignColumns: [churches.id, churches.organizationId],
      name: "church_group_invitations_church_organization_fk",
    }).onDelete("cascade"),
    index("church_group_invitations_user_id_status_idx").on(
      table.userId,
      table.status
    ),
  ]
);
