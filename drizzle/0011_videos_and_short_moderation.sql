CREATE TYPE "public"."short_moderation_status" AS ENUM('draft', 'pending_review', 'published', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."church_video_provider" AS ENUM('youtube', 'vimeo', 'instagram');--> statement-breakpoint
ALTER TABLE "video_shorts" ADD COLUMN "moderation_status" "short_moderation_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
UPDATE "video_shorts" SET "moderation_status" = 'published' WHERE "published_at" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "video_shorts_church_id_moderation_status_idx" ON "video_shorts" USING btree ("church_id","moderation_status");--> statement-breakpoint
CREATE TABLE "church_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_scope" "content_scope" DEFAULT 'organization' NOT NULL,
	"organization_id" uuid,
	"church_id" uuid,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"external_url" text NOT NULL,
	"provider" "church_video_provider" NOT NULL,
	"thumbnail_url" text,
	"category" "short_category" DEFAULT 'Other' NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone
);--> statement-breakpoint
ALTER TABLE "church_videos" ADD CONSTRAINT "church_videos_church_organization_fk" FOREIGN KEY ("church_id","organization_id") REFERENCES "public"."churches"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_videos" ADD CONSTRAINT "church_videos_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "church_videos_church_id_published_idx" ON "church_videos" USING btree ("church_id","published");--> statement-breakpoint
CREATE INDEX "church_videos_organization_id_church_id_idx" ON "church_videos" USING btree ("organization_id","church_id");--> statement-breakpoint
CREATE INDEX "church_videos_content_scope_idx" ON "church_videos" USING btree ("content_scope");
