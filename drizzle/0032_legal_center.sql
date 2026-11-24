CREATE TABLE IF NOT EXISTS "legal_document_versions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL,
  "version_label" text NOT NULL,
  "review_status" text NOT NULL,
  "locale" text DEFAULT 'en' NOT NULL,
  "title" text NOT NULL,
  "summary" text DEFAULT '' NOT NULL,
  "sections" jsonb NOT NULL,
  "material_change" boolean DEFAULT false NOT NULL,
  "change_summary" text DEFAULT '' NOT NULL,
  "effective_on" timestamp with time zone,
  "published_at" timestamp with time zone,
  "approved_by_user_id" uuid,
  "approver_name" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "legal_document_versions_slug_label_uidx" ON "legal_document_versions" ("slug","version_label");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "legal_document_versions_slug_status_idx" ON "legal_document_versions" ("slug","review_status");
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "legal_document_versions" ADD CONSTRAINT "legal_document_versions_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "legal_acceptances" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "version_id" uuid NOT NULL,
  "action" text NOT NULL,
  "locale" text DEFAULT 'en' NOT NULL,
  "source" text NOT NULL,
  "idempotency_key" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "legal_acceptances_idempotency_uidx" ON "legal_acceptances" ("idempotency_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "legal_acceptances_user_idx" ON "legal_acceptances" ("user_id","created_at");
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "legal_acceptances" ADD CONSTRAINT "legal_acceptances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "legal_acceptances" ADD CONSTRAINT "legal_acceptances_version_id_legal_document_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."legal_document_versions"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "consent_preferences" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "purpose" text NOT NULL,
  "granted" boolean DEFAULT false NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "consent_preferences_user_purpose_uidx" ON "consent_preferences" ("user_id","purpose");
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "consent_preferences" ADD CONSTRAINT "consent_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "privacy_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "request_type" text NOT NULL,
  "details" text DEFAULT '' NOT NULL,
  "status" text DEFAULT 'submitted' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "privacy_requests_user_idx" ON "privacy_requests" ("user_id","created_at");
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "privacy_requests" ADD CONSTRAINT "privacy_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "privacy_request_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "request_id" uuid NOT NULL,
  "actor_user_id" uuid,
  "status" text NOT NULL,
  "note" text DEFAULT '' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "privacy_request_events_request_idx" ON "privacy_request_events" ("request_id");
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "privacy_request_events" ADD CONSTRAINT "privacy_request_events_request_id_privacy_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."privacy_requests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "privacy_request_events" ADD CONSTRAINT "privacy_request_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "legal_review_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL,
  "version_id" uuid,
  "actor_user_id" uuid,
  "action" text NOT NULL,
  "note" text DEFAULT '' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "legal_review_events" ADD CONSTRAINT "legal_review_events_version_id_legal_document_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."legal_document_versions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "legal_review_events" ADD CONSTRAINT "legal_review_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
