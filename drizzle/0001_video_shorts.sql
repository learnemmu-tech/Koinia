CREATE TYPE "public"."short_category" AS ENUM('Worship', 'Sermon', 'Prayer', 'Bible', 'Testimony', 'Encouragement', 'Church Life', 'Events', 'Other');--> statement-breakpoint
CREATE TYPE "public"."short_visibility" AS ENUM('church', 'public');--> statement-breakpoint
CREATE TABLE "video_shorts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"church_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"video_url" text,
	"thumbnail_url" text,
	"caption" text DEFAULT '' NOT NULL,
	"category" "short_category" DEFAULT 'Other' NOT NULL,
	"duration" integer,
	"visibility" "short_visibility" DEFAULT 'church' NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone
);--> statement-breakpoint
CREATE TABLE "video_short_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"short_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "video_short_likes_short_user_unique" UNIQUE("short_id","user_id")
);--> statement-breakpoint
CREATE TABLE "video_short_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"short_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "video_short_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"short_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "video_short_reports_short_user_unique" UNIQUE("short_id","user_id")
);--> statement-breakpoint
ALTER TABLE "video_shorts" ADD CONSTRAINT "video_shorts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_shorts" ADD CONSTRAINT "video_shorts_church_organization_fk" FOREIGN KEY ("church_id","organization_id") REFERENCES "public"."churches"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_short_likes" ADD CONSTRAINT "video_short_likes_short_id_video_shorts_id_fk" FOREIGN KEY ("short_id") REFERENCES "public"."video_shorts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_short_likes" ADD CONSTRAINT "video_short_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_short_comments" ADD CONSTRAINT "video_short_comments_short_id_video_shorts_id_fk" FOREIGN KEY ("short_id") REFERENCES "public"."video_shorts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_short_comments" ADD CONSTRAINT "video_short_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_short_reports" ADD CONSTRAINT "video_short_reports_short_id_video_shorts_id_fk" FOREIGN KEY ("short_id") REFERENCES "public"."video_shorts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_short_reports" ADD CONSTRAINT "video_short_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "video_shorts_church_id_published_at_idx" ON "video_shorts" USING btree ("church_id","published_at");--> statement-breakpoint
CREATE INDEX "video_shorts_organization_id_church_id_idx" ON "video_shorts" USING btree ("organization_id","church_id");--> statement-breakpoint
CREATE INDEX "video_shorts_user_id_idx" ON "video_shorts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "video_shorts_visibility_idx" ON "video_shorts" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "video_shorts_created_at_idx" ON "video_shorts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "video_short_likes_short_id_idx" ON "video_short_likes" USING btree ("short_id");--> statement-breakpoint
CREATE INDEX "video_short_comments_short_id_created_at_idx" ON "video_short_comments" USING btree ("short_id","created_at");--> statement-breakpoint
CREATE INDEX "video_short_reports_short_id_idx" ON "video_short_reports" USING btree ("short_id");
