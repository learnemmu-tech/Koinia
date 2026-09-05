import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
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
    index("subscriptions_stripe_customer_id_idx").on(table.stripeCustomerId),
  ]
);
