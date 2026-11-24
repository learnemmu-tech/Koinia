ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'donation_request_submitted';
--> statement-breakpoint
ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'donation_request_decision';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "donation_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "church_id" uuid NOT NULL,
  "member_id" uuid NOT NULL,
  "title" text NOT NULL,
  "category" text NOT NULL,
  "reason" text NOT NULL,
  "amount" numeric(12, 2),
  "currency" text DEFAULT 'INR' NOT NULL,
  "additional_information" text DEFAULT '' NOT NULL,
  "status" text DEFAULT 'submitted' NOT NULL,
  "member_response" text DEFAULT '' NOT NULL,
  "reviewer_id" uuid,
  "reviewed_at" timestamp with time zone,
  "campaign_id" uuid,
  "acknowledged" boolean DEFAULT false NOT NULL,
  "idempotency_key" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "donation_requests_idempotency_uidx" ON "donation_requests" ("idempotency_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "donation_requests_church_status_idx" ON "donation_requests" ("church_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "donation_requests_member_idx" ON "donation_requests" ("member_id","created_at");
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "donation_requests" ADD CONSTRAINT "donation_requests_church_organization_fk" FOREIGN KEY ("church_id","organization_id") REFERENCES "public"."churches"("id","organization_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "donation_requests" ADD CONSTRAINT "donation_requests_member_id_users_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "donation_requests" ADD CONSTRAINT "donation_requests_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "donation_request_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "request_id" uuid NOT NULL,
  "actor_user_id" uuid,
  "action" text NOT NULL,
  "note" text DEFAULT '' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "donation_request_events_request_idx" ON "donation_request_events" ("request_id","created_at");
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "donation_request_events" ADD CONSTRAINT "donation_request_events_request_id_donation_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."donation_requests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "donation_request_events" ADD CONSTRAINT "donation_request_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
