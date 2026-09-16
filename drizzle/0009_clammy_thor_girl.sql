CREATE TABLE "prayer_response_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"response_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prayer_response_likes_response_user_unique" UNIQUE("response_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "prayer_response_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"response_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prayer_response_reports_response_user_unique" UNIQUE("response_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "prayer_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prayer_request_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"parent_id" uuid,
	"content" text NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "prayer_response_likes" ADD CONSTRAINT "prayer_response_likes_response_id_prayer_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."prayer_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_response_likes" ADD CONSTRAINT "prayer_response_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_response_reports" ADD CONSTRAINT "prayer_response_reports_response_id_prayer_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."prayer_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_response_reports" ADD CONSTRAINT "prayer_response_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_responses" ADD CONSTRAINT "prayer_responses_prayer_request_id_prayer_requests_id_fk" FOREIGN KEY ("prayer_request_id") REFERENCES "public"."prayer_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_responses" ADD CONSTRAINT "prayer_responses_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_responses" ADD CONSTRAINT "prayer_responses_parent_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."prayer_responses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "prayer_response_likes_response_id_idx" ON "prayer_response_likes" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "prayer_response_reports_response_id_idx" ON "prayer_response_reports" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "prayer_responses_request_created_at_idx" ON "prayer_responses" USING btree ("prayer_request_id","created_at");--> statement-breakpoint
CREATE INDEX "prayer_responses_parent_id_idx" ON "prayer_responses" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "prayer_responses_author_id_idx" ON "prayer_responses" USING btree ("author_id");