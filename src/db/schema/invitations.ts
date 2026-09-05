import { sql } from "drizzle-orm";
import {
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import {
  invitationDeliveryMethodEnum,
  invitationRoleEnum,
  invitationStatusEnum,
} from "./enums";
import { churches, organizations, users } from "./tenants";

export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    churchId: uuid("church_id").notNull(),
    role: invitationRoleEnum("role").notNull(),
    email: text("email"),
    deliveryMethod: invitationDeliveryMethodEnum("delivery_method").notNull(),
    token: text("token").notNull().unique(),
    invitedBy: uuid("invited_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: invitationStatusEnum("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    acceptedAt: timestamp("accepted_at", {
      withTimezone: true,
      mode: "date",
    }),
    acceptedBy: uuid("accepted_by").references(() => users.id, {
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
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: "invitations_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.churchId, table.organizationId],
      foreignColumns: [churches.id, churches.organizationId],
      name: "invitations_church_organization_fk",
    }).onDelete("cascade"),
    uniqueIndex("invitations_pending_email_church_unique")
      .on(table.churchId, table.email)
      .where(sql`${table.status} = 'pending' AND ${table.email} IS NOT NULL`),
    index("invitations_organization_id_created_at_idx").on(
      table.organizationId,
      table.createdAt
    ),
    index("invitations_church_id_status_idx").on(table.churchId, table.status),
  ]
);
