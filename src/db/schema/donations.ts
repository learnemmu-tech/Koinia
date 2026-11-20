import {
  boolean,
  foreignKey,
  index,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import {
  contentScopeEnum,
  donationCampaignStatusEnum,
  donationCurrencyEnum,
  donationReceivingMethodEnum,
  donationRecordSourceEnum,
  donationVerificationStatusEnum,
  paymentProviderEnum,
  paymentStatusEnum,
} from "./enums";
import { churches, users } from "./tenants";
import { storedObjects } from "./stored-objects";

export const donationCampaigns = pgTable(
  "donation_campaigns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contentScope: contentScopeEnum("content_scope")
      .notNull()
      .default("organization"),
    organizationId: uuid("organization_id"),
    churchId: uuid("church_id"),
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
    startsAt: timestamp("starts_at", { withTimezone: true, mode: "date" }),
    endsAt: timestamp("ends_at", { withTimezone: true, mode: "date" }),
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
    index("donation_campaigns_content_scope_idx").on(table.contentScope),
  ]
);

export const donations = pgTable(
  "donations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contentScope: contentScopeEnum("content_scope")
      .notNull()
      .default("organization"),
    organizationId: uuid("organization_id"),
    churchId: uuid("church_id"),
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
    idempotencyKey: text("idempotency_key"),
    isAnonymous: boolean("is_anonymous").notNull().default(false),
    receivingMethod: donationReceivingMethodEnum("receiving_method"),
    verificationStatus: donationVerificationStatusEnum("verification_status"),
    recordSource: donationRecordSourceEnum("record_source")
      .notNull()
      .default("gateway"),
    donorPhone: text("donor_phone"),
    paymentReference: text("payment_reference"),
    evidenceStoredObjectId: uuid("evidence_stored_object_id").references(
      () => storedObjects.id,
      { onDelete: "set null" }
    ),
    internalNotes: text("internal_notes"),
    rejectionReason: text("rejection_reason"),
    recordedByUserId: uuid("recorded_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    verifiedByUserId: uuid("verified_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    verifiedAt: timestamp("verified_at", { withTimezone: true, mode: "date" }),
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
    uniqueIndex("donations_idempotency_key_unique").on(table.idempotencyKey),
    index("donations_organization_id_church_id_idx").on(
      table.organizationId,
      table.churchId
    ),
    index("donations_content_scope_idx").on(table.contentScope),
    index("donations_church_verification_status_idx").on(
      table.churchId,
      table.verificationStatus,
      table.createdAt
    ),
  ]
);

/** Church declaration that it is authorized to receive donations in India. */
export const churchDonationProfiles = pgTable(
  "church_donation_profiles",
  {
    churchId: uuid("church_id").primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    authorizedDeclaration: boolean("authorized_declaration").notNull().default(false),
    declarationAcceptedAt: timestamp("declaration_accepted_at", {
      withTimezone: true,
      mode: "date",
    }),
    declarationAcceptedBy: uuid("declaration_accepted_by").references(() => users.id, {
      onDelete: "set null",
    }),
    /** Reserved. This release keeps foreign donations disabled. */
    foreignDonationsEnabled: boolean("foreign_donations_enabled")
      .notNull()
      .default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    foreignKey({
      columns: [table.churchId, table.organizationId],
      foreignColumns: [churches.id, churches.organizationId],
      name: "church_donation_profiles_church_organization_fk",
    }).onDelete("cascade"),
  ]
);

export const churchDonationMethods = pgTable(
  "church_donation_methods",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    churchId: uuid("church_id").notNull(),
    organizationId: uuid("organization_id").notNull(),
    method: donationReceivingMethodEnum("method").notNull(),
    enabled: boolean("enabled").notNull().default(false),
    displayName: text("display_name").notNull().default(""),
    instructions: text("instructions"),
    upiId: text("upi_id"),
    qrStoredObjectId: uuid("qr_stored_object_id").references(() => storedObjects.id, {
      onDelete: "set null",
    }),
    accountHolderName: text("account_holder_name"),
    bankName: text("bank_name"),
    /** AES-256-GCM payload. Never selected for logs. */
    accountNumberCiphertext: text("account_number_ciphertext"),
    accountNumberLast4: text("account_number_last4"),
    ifscCode: text("ifsc_code"),
    branchName: text("branch_name"),
    /** declared = church entered the details. Not a legal or bank verification. */
    ownershipStatus: text("ownership_status").notNull().default("declared"),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    foreignKey({
      columns: [table.churchId, table.organizationId],
      foreignColumns: [churches.id, churches.organizationId],
      name: "church_donation_methods_church_organization_fk",
    }).onDelete("cascade"),
    uniqueIndex("church_donation_methods_church_method_unique").on(
      table.churchId,
      table.method
    ),
  ]
);

export const donationCampaignMethods = pgTable(
  "donation_campaign_methods",
  {
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => donationCampaigns.id, { onDelete: "cascade" }),
    method: donationReceivingMethodEnum("method").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.campaignId, table.method] }),
    index("donation_campaign_methods_campaign_id_idx").on(table.campaignId),
  ]
);

export const donationVerificationEvents = pgTable(
  "donation_verification_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    donationId: uuid("donation_id")
      .notNull()
      .references(() => donations.id, { onDelete: "restrict" }),
    organizationId: uuid("organization_id"),
    churchId: uuid("church_id"),
    action: text("action").notNull(),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.churchId, table.organizationId],
      foreignColumns: [churches.id, churches.organizationId],
      name: "donation_verification_events_church_organization_fk",
    }).onDelete("cascade"),
    index("donation_verification_events_donation_id_idx").on(table.donationId),
    index("donation_verification_events_church_id_created_at_idx").on(
      table.churchId,
      table.createdAt
    ),
  ]
);
