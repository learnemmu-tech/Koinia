ALTER TABLE "video_short_comments" ADD COLUMN IF NOT EXISTS "parent_id" uuid;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "video_short_comments" ADD CONSTRAINT "video_short_comments_parent_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."video_short_comments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "video_short_comments_parent_id_idx" ON "video_short_comments" USING btree ("parent_id");
