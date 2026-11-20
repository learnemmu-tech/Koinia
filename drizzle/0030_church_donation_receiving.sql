ALTER TYPE "payment_provider" ADD VALUE IF NOT EXISTS 'church_direct';

DO $$ BEGIN
  CREATE TYPE "donation_receiving_method" AS ENUM ('upi_qr', 'upi_id', 'bank_transfer', 'offline');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "donation_verification_status" AS ENUM ('awaiting_verification', 'verified', 'rejected', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "donation_record_source" AS ENUM ('gateway', 'member_submission', 'admin_offline');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "donation_campaigns" ADD COLUMN IF NOT EXISTS "starts_at" timestamp with time zone;
ALTER TABLE "donation_campaigns" ADD COLUMN IF NOT EXISTS "ends_at" timestamp with time zone;

ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "receiving_method" "donation_receiving_method";
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "verification_status" "donation_verification_status";
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "record_source" "donation_record_source" NOT NULL DEFAULT 'gateway';
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "donor_phone" text;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "payment_reference" text;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "evidence_stored_object_id" uuid;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "internal_notes" text;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "rejection_reason" text;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "recorded_by_user_id" uuid;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "verified_by_user_id" uuid;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "verified_at" timestamp with time zone;

DO $$ BEGIN
  ALTER TABLE "donations" ADD CONSTRAINT "donations_evidence_stored_object_id_stored_objects_id_fk" FOREIGN KEY ("evidence_stored_object_id") REFERENCES "stored_objects"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "donations" ADD CONSTRAINT "donations_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "donations" ADD CONSTRAINT "donations_verified_by_user_id_users_id_fk" FOREIGN KEY ("verified_by_user_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "donations_church_verification_status_idx" ON "donations" USING btree ("church_id","verification_status","created_at");

CREATE TABLE IF NOT EXISTS "church_donation_profiles" (
  "church_id" uuid PRIMARY KEY NOT NULL,
  "organization_id" uuid NOT NULL,
  "authorized_declaration" boolean DEFAULT false NOT NULL,
  "declaration_accepted_at" timestamp with time zone,
  "declaration_accepted_by" uuid,
  "foreign_donations_enabled" boolean DEFAULT false NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "church_donation_profiles" ADD CONSTRAINT "church_donation_profiles_church_organization_fk" FOREIGN KEY ("church_id","organization_id") REFERENCES "churches"("id","organization_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "church_donation_profiles" ADD CONSTRAINT "church_donation_profiles_declaration_accepted_by_users_id_fk" FOREIGN KEY ("declaration_accepted_by") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "church_donation_methods" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "church_id" uuid NOT NULL,
  "organization_id" uuid NOT NULL,
  "method" "donation_receiving_method" NOT NULL,
  "enabled" boolean DEFAULT false NOT NULL,
  "display_name" text DEFAULT '' NOT NULL,
  "instructions" text,
  "upi_id" text,
  "qr_stored_object_id" uuid,
  "account_holder_name" text,
  "bank_name" text,
  "account_number_ciphertext" text,
  "account_number_last4" text,
  "ifsc_code" text,
  "branch_name" text,
  "ownership_status" text DEFAULT 'declared' NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "church_donation_methods_church_method_unique" ON "church_donation_methods" USING btree ("church_id","method");

DO $$ BEGIN
  ALTER TABLE "church_donation_methods" ADD CONSTRAINT "church_donation_methods_church_organization_fk" FOREIGN KEY ("church_id","organization_id") REFERENCES "churches"("id","organization_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "church_donation_methods" ADD CONSTRAINT "church_donation_methods_qr_stored_object_id_stored_objects_id_fk" FOREIGN KEY ("qr_stored_object_id") REFERENCES "stored_objects"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "donation_campaign_methods" (
  "campaign_id" uuid NOT NULL,
  "method" "donation_receiving_method" NOT NULL,
  CONSTRAINT "donation_campaign_methods_campaign_id_method_pk" PRIMARY KEY("campaign_id","method")
);

DO $$ BEGIN
  ALTER TABLE "donation_campaign_methods" ADD CONSTRAINT "donation_campaign_methods_campaign_id_donation_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "donation_campaigns"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "donation_campaign_methods_campaign_id_idx" ON "donation_campaign_methods" USING btree ("campaign_id");

CREATE TABLE IF NOT EXISTS "donation_verification_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "donation_id" uuid NOT NULL,
  "organization_id" uuid,
  "church_id" uuid,
  "action" text NOT NULL,
  "actor_user_id" uuid,
  "reason" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "donation_verification_events" ADD CONSTRAINT "donation_verification_events_donation_id_donations_id_fk" FOREIGN KEY ("donation_id") REFERENCES "donations"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "donation_verification_events" ADD CONSTRAINT "donation_verification_events_church_organization_fk" FOREIGN KEY ("church_id","organization_id") REFERENCES "churches"("id","organization_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "donation_verification_events" ADD CONSTRAINT "donation_verification_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "donation_verification_events_donation_id_idx" ON "donation_verification_events" USING btree ("donation_id");
CREATE INDEX IF NOT EXISTS "donation_verification_events_church_id_created_at_idx" ON "donation_verification_events" USING btree ("church_id","created_at");
