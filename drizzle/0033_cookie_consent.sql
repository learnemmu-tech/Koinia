CREATE TABLE IF NOT EXISTS "cookie_consent_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "anonymous_id" text NOT NULL,
  "user_id" uuid,
  "action" text NOT NULL,
  "categories" jsonb NOT NULL,
  "consent_version" text NOT NULL,
  "policy_version" text NOT NULL,
  "origin_host" text DEFAULT '' NOT NULL,
  "locale" text DEFAULT 'en' NOT NULL,
  "idempotency_key" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cookie_consent_events_idempotency_uidx" ON "cookie_consent_events" ("idempotency_key");
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cookie_consent_events" ADD CONSTRAINT "cookie_consent_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
