import {
  date,
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { eventStatusEnum, eventTypeEnum } from "./enums";
import { churches, users } from "./tenants";

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    churchId: uuid("church_id").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    bannerImage: text("banner_image"),
    eventType: eventTypeEnum("event_type").notNull().default("Other"),
    speakerName: text("speaker_name").notNull().default(""),
    eventDate: date("event_date").notNull(),
    eventTime: text("event_time").notNull().default(""),
    location: text("location").notNull().default(""),
    status: eventStatusEnum("status").notNull().default("draft"),
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
      name: "events_church_organization_fk",
    }).onDelete("cascade"),
    index("events_church_id_event_date_idx").on(table.churchId, table.eventDate),
    index("events_church_id_status_event_date_idx").on(
      table.churchId,
      table.status,
      table.eventDate
    ),
    index("events_organization_id_church_id_idx").on(
      table.organizationId,
      table.churchId
    ),
  ]
);

export const eventRegistrations = pgTable(
  "event_registrations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    churchId: uuid("church_id").notNull(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userEmail: text("user_email").notNull(),
    userName: text("user_name").notNull().default("Guest"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("event_registrations_event_user_unique").on(
      table.eventId,
      table.userId
    ),
    foreignKey({
      columns: [table.churchId, table.organizationId],
      foreignColumns: [churches.id, churches.organizationId],
      name: "event_registrations_church_organization_fk",
    }).onDelete("cascade"),
    index("event_registrations_user_id_idx").on(table.userId),
    index("event_registrations_church_id_created_at_idx").on(
      table.churchId,
      table.createdAt
    ),
  ]
);
