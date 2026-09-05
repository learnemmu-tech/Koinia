import {
  boolean,
  foreignKey,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import {
  donationCampaignStatusEnum,
  donationCurrencyEnum,
  paymentProviderEnum,
  paymentStatusEnum,
} from "./enums";
import { churches } from "./tenants";

export const donationCampaigns = pgTable(
  "donation_campaigns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    churchId: uuid("church_id").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    bannerImage: text("banner_image"),
    targetAmount: numeric("target_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    currentAmount: numeric("current_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    currency: donationCurrencyEnum("currency").notNull().default("INR"),
    status: donationCampaignStatusEnum("status").notNull().default("active"),
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
      name: "donation_campaigns_church_organization_fk",
    }).onDelete("cascade"),
    index("donation_campaigns_church_id_created_at_idx").on(
      table.churchId,
      table.createdAt
    ),
    index("donation_campaigns_church_id_status_created_at_idx").on(
      table.churchId,
      table.status,
      table.createdAt
    ),
    index("donation_campaigns_organization_id_church_id_idx").on(
      table.organizationId,
      table.churchId
    ),
  ]
);

export const donations = pgTable(
  "donations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    churchId: uuid("church_id").notNull(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => donationCampaigns.id, { onDelete: "restrict" }),
    donorName: text("donor_name").notNull(),
    donorEmail: text("donor_email").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    currency: donationCurrencyEnum("currency").notNull(),
    paymentStatus: paymentStatusEnum("payment_status")
      .notNull()
      .default("pending"),
    paymentProvider: paymentProviderEnum("payment_provider").notNull(),
    transactionId: text("transaction_id").notNull(),
    isAnonymous: boolean("is_anonymous").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.churchId, table.organizationId],
      foreignColumns: [churches.id, churches.organizationId],
      name: "donations_church_organization_fk",
    }).onDelete("cascade"),
    index("donations_church_id_created_at_idx").on(
      table.churchId,
      table.createdAt
    ),
    index("donations_church_id_payment_status_created_at_idx").on(
      table.churchId,
      table.paymentStatus,
      table.createdAt
    ),
    index("donations_donor_email_created_at_idx").on(
      table.donorEmail,
      table.createdAt
    ),
    index("donations_campaign_id_idx").on(table.campaignId),
    index("donations_transaction_id_idx").on(table.transactionId),
    index("donations_organization_id_church_id_idx").on(
      table.organizationId,
      table.churchId
    ),
  ]
);
