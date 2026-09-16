ALTER TYPE "public"."notification_type" ADD VALUE 'trial_lifecycle';--> statement-breakpoint
CREATE TABLE "trial_lifecycle_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"event_key" text NOT NULL,
	"status" text DEFAULT 'processing' NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	CONSTRAINT "trial_lifecycle_events_organization_event_unique" UNIQUE("organization_id","event_key")
);
--> statement-breakpoint
ALTER TABLE "trial_lifecycle_events" ADD CONSTRAINT "trial_lifecycle_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "trial_lifecycle_events_status_idx" ON "trial_lifecycle_events" USING btree ("status");