import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import {
  storedObjectPurposeEnum,
  storedObjectStatusEnum,
  storedObjectVisibilityEnum,
} from "./enums";
import { churches, users } from "./tenants";

export const storedObjects = pgTable(
  "stored_objects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    churchId: uuid("church_id").notNull(),
    uploadedBy: uuid("uploaded_by").references(() => users.id, {
      onDelete: "set null",
    }),
    objectKey: text("object_key").notNull(),
    originalFilename: text("original_filename").notNull(),
    mimeType: text("mime_type").notNull(),
    extension: text("extension").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    sha256: text("sha256"),
    visibility: storedObjectVisibilityEnum("visibility").notNull(),
    status: storedObjectStatusEnum("status").notNull().default("pending"),
    purpose: storedObjectPurposeEnum("purpose").notNull(),
    published: boolean("published").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    readyAt: timestamp("ready_at", { withTimezone: true, mode: "date" }),
  },
  (table) => [
    unique("stored_objects_object_key_unique").on(table.objectKey),
    check(
      "stored_objects_private_not_published",
      sql`${table.visibility} = 'public_read' OR ${table.published} = false`
    ),
    foreignKey({
      columns: [table.churchId, table.organizationId],
      foreignColumns: [churches.id, churches.organizationId],
      name: "stored_objects_church_organization_fk",
    }).onDelete("restrict"),
    index("stored_objects_church_id_status_idx").on(table.churchId, table.status),
    index("stored_objects_organization_id_church_id_idx").on(
      table.organizationId,
      table.churchId
    ),
  ]
);
