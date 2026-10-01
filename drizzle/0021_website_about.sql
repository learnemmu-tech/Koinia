ALTER TABLE "church_websites"
  ADD COLUMN IF NOT EXISTS "about_headline" text;--> statement-breakpoint
ALTER TABLE "church_websites"
  ADD COLUMN IF NOT EXISTS "about_intro" text;--> statement-breakpoint
ALTER TABLE "church_websites"
  ADD COLUMN IF NOT EXISTS "about_mission" text;--> statement-breakpoint
ALTER TABLE "church_websites"
  ADD COLUMN IF NOT EXISTS "about_vision" text;
