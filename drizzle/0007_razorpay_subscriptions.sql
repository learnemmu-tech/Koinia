ALTER TABLE "subscriptions" ADD COLUMN "provider" text;
ALTER TABLE "subscriptions" ADD COLUMN "provider_status" text;
ALTER TABLE "subscriptions" ADD COLUMN "razorpay_subscription_id" text;
ALTER TABLE "subscriptions" ADD COLUMN "razorpay_plan_id" text;
ALTER TABLE "subscriptions" ADD COLUMN "razorpay_customer_id" text;
ALTER TABLE "subscriptions" ADD COLUMN "canceled_at" timestamp with time zone;
CREATE TABLE "subscription_webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"subscription_id" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "subscription_webhook_events_provider_event_id" UNIQUE("provider", "event_id")
);
CREATE INDEX "subscriptions_razorpay_subscription_id_idx" ON "subscriptions" USING btree ("razorpay_subscription_id");
CREATE INDEX "subscription_webhook_events_subscription_id_idx" ON "subscription_webhook_events" USING btree ("subscription_id");
CREATE TABLE "subscription_checkout_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"request_id" text NOT NULL,
	"plan_id" "plan_id" NOT NULL,
	"status" text DEFAULT 'creating' NOT NULL,
	"provider_subscription_id" text,
	"provider_status" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_checkout_attempts_organization_id_unique" UNIQUE("organization_id"),
	CONSTRAINT "subscription_checkout_attempts_provider_subscription_id_unique" UNIQUE("provider_subscription_id")
);
ALTER TABLE "subscription_checkout_attempts" ADD CONSTRAINT "subscription_checkout_attempts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "subscription_checkout_attempts_request_id_idx" ON "subscription_checkout_attempts" USING btree ("request_id");
