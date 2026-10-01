CREATE TABLE IF NOT EXISTS "church_websites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "church_id" uuid NOT NULL,
  "organization_id" uuid NOT NULL,
  "active_template" text DEFAULT 'signature' NOT NULL,
  "site_title" text,
  "meta_description" text,
  "favicon_url" text,
  "og_image_url" text,
  "canonical_url" text,
  "indexable" boolean DEFAULT true NOT NULL,
  "logo_url" text,
  "hero_image_url" text,
  "about_image_url" text,
  "featured_ministry_image_url" text,
  "worship_image_url" text,
  "social_preview_image_url" text,
  "hero_eyebrow" text,
  "hero_headline" text,
  "hero_subheadline" text,
  "scripture_reference" text,
  "scripture_text" text,
  "service_label" text,
  "service_time" text,
  "service_location" text,
  "social_links" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "visibility" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "church_websites_church_id_unique" UNIQUE ("church_id"),
  CONSTRAINT "church_websites_church_organization_unique" UNIQUE ("church_id", "organization_id"),
  CONSTRAINT "church_websites_active_template_check" CHECK (
    "active_template" IN ('signature', 'heritage', 'sanctuary')
  )
);--> statement-breakpoint
ALTER TABLE "church_websites"
  ADD CONSTRAINT "church_websites_organization_id_organizations_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id")
  ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_websites"
  ADD CONSTRAINT "church_websites_church_organization_fk"
  FOREIGN KEY ("church_id", "organization_id")
  REFERENCES "public"."churches"("id", "organization_id")
  ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "church_websites_organization_id_idx"
  ON "church_websites" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "church_websites_active_template_idx"
  ON "church_websites" ("active_template");
