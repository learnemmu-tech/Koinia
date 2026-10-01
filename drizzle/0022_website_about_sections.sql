ALTER TABLE "church_websites"
  ADD COLUMN IF NOT EXISTS "about_community" text;--> statement-breakpoint
ALTER TABLE "church_websites"
  ADD COLUMN IF NOT EXISTS "about_values" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "church_websites"
  ADD COLUMN IF NOT EXISTS "about_beliefs" jsonb DEFAULT '[]'::jsonb NOT NULL;
