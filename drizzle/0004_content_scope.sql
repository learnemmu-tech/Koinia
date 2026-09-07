CREATE TYPE "public"."content_scope" AS ENUM('organization', 'platform_public');--> statement-breakpoint
ALTER TABLE "songs" ADD COLUMN "content_scope" "content_scope" DEFAULT 'organization' NOT NULL;--> statement-breakpoint
ALTER TABLE "songs" ALTER COLUMN "organization_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "songs" ALTER COLUMN "church_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "songs" ADD CONSTRAINT "songs_content_scope_ownership_chk" CHECK ((content_scope = 'platform_public' AND organization_id IS NULL AND church_id IS NULL) OR (content_scope = 'organization' AND organization_id IS NOT NULL AND church_id IS NOT NULL));--> statement-breakpoint
ALTER TABLE "sermons" ADD COLUMN "content_scope" "content_scope" DEFAULT 'organization' NOT NULL;--> statement-breakpoint
ALTER TABLE "sermons" ALTER COLUMN "organization_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sermons" ALTER COLUMN "church_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sermons" ADD CONSTRAINT "sermons_content_scope_ownership_chk" CHECK ((content_scope = 'platform_public' AND organization_id IS NULL AND church_id IS NULL) OR (content_scope = 'organization' AND organization_id IS NOT NULL AND church_id IS NOT NULL));--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "content_scope" "content_scope" DEFAULT 'organization' NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" ALTER COLUMN "organization_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" ALTER COLUMN "church_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_content_scope_ownership_chk" CHECK ((content_scope = 'platform_public' AND organization_id IS NULL AND church_id IS NULL) OR (content_scope = 'organization' AND organization_id IS NOT NULL AND church_id IS NOT NULL));--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "content_scope" "content_scope" DEFAULT 'organization' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "organization_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "church_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_content_scope_ownership_chk" CHECK ((content_scope = 'platform_public' AND organization_id IS NULL AND church_id IS NULL) OR (content_scope = 'organization' AND organization_id IS NOT NULL AND church_id IS NOT NULL));--> statement-breakpoint
ALTER TABLE "prayer_requests" ADD COLUMN "content_scope" "content_scope" DEFAULT 'organization' NOT NULL;--> statement-breakpoint
ALTER TABLE "prayer_requests" ALTER COLUMN "organization_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "prayer_requests" ALTER COLUMN "church_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "prayer_requests" ADD CONSTRAINT "prayer_requests_content_scope_ownership_chk" CHECK ((content_scope = 'platform_public' AND organization_id IS NULL AND church_id IS NULL) OR (content_scope = 'organization' AND organization_id IS NOT NULL AND church_id IS NOT NULL));--> statement-breakpoint
ALTER TABLE "donation_campaigns" ADD COLUMN "content_scope" "content_scope" DEFAULT 'organization' NOT NULL;--> statement-breakpoint
ALTER TABLE "donation_campaigns" ALTER COLUMN "organization_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "donation_campaigns" ALTER COLUMN "church_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "donation_campaigns" ADD CONSTRAINT "donation_campaigns_content_scope_ownership_chk" CHECK ((content_scope = 'platform_public' AND organization_id IS NULL AND church_id IS NULL) OR (content_scope = 'organization' AND organization_id IS NOT NULL AND church_id IS NOT NULL));--> statement-breakpoint
ALTER TABLE "donations" ADD COLUMN "content_scope" "content_scope" DEFAULT 'organization' NOT NULL;--> statement-breakpoint
ALTER TABLE "donations" ALTER COLUMN "organization_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "donations" ALTER COLUMN "church_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_content_scope_ownership_chk" CHECK ((content_scope = 'platform_public' AND organization_id IS NULL AND church_id IS NULL) OR (content_scope = 'organization' AND organization_id IS NOT NULL AND church_id IS NOT NULL));--> statement-breakpoint
ALTER TABLE "video_shorts" ADD COLUMN "content_scope" "content_scope" DEFAULT 'organization' NOT NULL;--> statement-breakpoint
ALTER TABLE "video_shorts" ALTER COLUMN "organization_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "video_shorts" ALTER COLUMN "church_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "video_shorts" ADD CONSTRAINT "video_shorts_content_scope_ownership_chk" CHECK ((content_scope = 'platform_public' AND organization_id IS NULL AND church_id IS NULL) OR (content_scope = 'organization' AND organization_id IS NOT NULL AND church_id IS NOT NULL));--> statement-breakpoint
CREATE INDEX "songs_content_scope_idx" ON "songs" USING btree ("content_scope");--> statement-breakpoint
CREATE INDEX "sermons_content_scope_idx" ON "sermons" USING btree ("content_scope");--> statement-breakpoint
CREATE INDEX "articles_content_scope_idx" ON "articles" USING btree ("content_scope");--> statement-breakpoint
CREATE INDEX "events_content_scope_idx" ON "events" USING btree ("content_scope");--> statement-breakpoint
CREATE INDEX "prayer_requests_content_scope_idx" ON "prayer_requests" USING btree ("content_scope");--> statement-breakpoint
CREATE INDEX "donation_campaigns_content_scope_idx" ON "donation_campaigns" USING btree ("content_scope");--> statement-breakpoint
CREATE INDEX "donations_content_scope_idx" ON "donations" USING btree ("content_scope");--> statement-breakpoint
CREATE INDEX "video_shorts_content_scope_idx" ON "video_shorts" USING btree ("content_scope");
