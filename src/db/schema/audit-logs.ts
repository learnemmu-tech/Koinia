import { sql } from "drizzle-orm";
import {
  foreignKey,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { churches, organizations, users } from "./tenants";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    organizationId: uuid("organization_id"),
    churchId: uuid("church_id"),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: "audit_logs_organization_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.churchId],
      foreignColumns: [churches.id],
      name: "audit_logs_church_id_fk",
    }).onDelete("set null"),
    index("audit_logs_organization_id_created_at_idx").on(
      table.organizationId,
      table.createdAt
    ),
    index("audit_logs_church_id_created_at_idx").on(
      table.churchId,
      table.createdAt
    ),
    index("audit_logs_actor_user_id_created_at_idx").on(
      table.actorUserId,
      table.createdAt
    ),
    index("audit_logs_entity_type_entity_id_idx").on(
      table.entityType,
      table.entityId
    ),
  ]
);
