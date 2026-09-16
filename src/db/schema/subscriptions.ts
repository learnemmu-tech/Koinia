import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import {
  billingIntervalEnum,
  planIdEnum,
  subscriptionStatusEnum,
} from "./enums";
import { organizations } from "./tenants";

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .unique()
      .references(() => organizations.id, { onDelete: "cascade" }),
    planId: planIdEnum("plan_id").notNull().default("free"),
    status: subscriptionStatusEnum("status").notNull().default("active"),
    billingInterval: billingIntervalEnum("billing_interval"),
    trialStart: timestamp("trial_start", { withTimezone: true, mode: "date" }),
    trialEnd: timestamp("trial_end", { withTimezone: true, mode: "date" }),
    currentPeriodStart: timestamp("current_period_start", {
      withTimezone: true,
      mode: "date",
    }),
    currentPeriodEnd: timestamp("current_period_end", {
      withTimezone: true,
      mode: "date",
    }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    featureFlags: jsonb("feature_flags").notNull().default(sql`'{}'::jsonb`),
    usage: jsonb("usage").notNull().default(sql`'{}'::jsonb`),
    provider: text("provider"),
    providerStatus: text("provider_status"),
    razorpaySubscriptionId: text("razorpay_subscription_id"),
    razorpayPlanId: text("razorpay_plan_id"),
    razorpayCustomerId: text("razorpay_customer_id"),
    canceledAt: timestamp("canceled_at", { withTimezone: true, mode: "date" }),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("subscriptions_status_idx").on(table.status),
    index("subscriptions_razorpay_subscription_id_idx").on(
      table.razorpaySubscriptionId
    ),
    index("subscriptions_stripe_customer_id_idx").on(table.stripeCustomerId),
  ]
);

export const subscriptionWebhookEvents = pgTable(
  "subscription_webhook_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    provider: text("provider").notNull(),
    eventId: text("event_id").notNull(),
    eventType: text("event_type").notNull(),
    subscriptionId: text("subscription_id"),
    receivedAt: timestamp("received_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true, mode: "date" }),
  },
  (table) => [
    unique("subscription_webhook_events_provider_event_id").on(
      table.provider,
      table.eventId
    ),
    index("subscription_webhook_events_subscription_id_idx").on(
      table.subscriptionId
    ),
  ]
);

export const subscriptionCheckoutAttempts = pgTable(
  "subscription_checkout_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .unique()
      .references(() => organizations.id, { onDelete: "cascade" }),
    requestId: text("request_id").notNull(),
    planId: planIdEnum("plan_id").notNull(),
    status: text("status").notNull().default("creating"),
    providerSubscriptionId: text("provider_subscription_id").unique(),
    providerStatus: text("provider_status"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("subscription_checkout_attempts_request_id_idx").on(
      table.requestId
    ),
  ]
);

export const trialLifecycleEvents = pgTable(
  "trial_lifecycle_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    eventKey: text("event_key").notNull(),
    status: text("status").notNull().default("processing"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    sentAt: timestamp("sent_at", { withTimezone: true, mode: "date" }),
  },
  (table) => [
    unique("trial_lifecycle_events_organization_event_unique").on(
      table.organizationId,
      table.eventKey
    ),
    index("trial_lifecycle_events_status_idx").on(table.status),
  ]
);
