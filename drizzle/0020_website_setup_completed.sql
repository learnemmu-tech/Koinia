ALTER TABLE "church_websites"
  ADD COLUMN IF NOT EXISTS "website_setup_completed_at" timestamp with time zone;--> statement-breakpoint
UPDATE "church_websites"
  SET "website_setup_completed_at" = "created_at"
  WHERE "website_setup_completed_at" IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "church_websites_setup_completed_idx"
  ON "church_websites" ("website_setup_completed_at");
