CREATE TABLE "church_group_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"church_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"reply_to_message_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"edited_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);--> statement-breakpoint
CREATE TABLE "church_group_message_reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"church_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"message_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"reaction_type" text DEFAULT 'heart' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "church_group_message_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"church_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"message_id" uuid NOT NULL,
	"reporter_user_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "church_group_messages" ADD CONSTRAINT "church_group_messages_group_id_church_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."church_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_group_messages" ADD CONSTRAINT "church_group_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_group_messages" ADD CONSTRAINT "church_group_messages_church_organization_fk" FOREIGN KEY ("church_id","organization_id") REFERENCES "public"."churches"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_group_messages" ADD CONSTRAINT "church_group_messages_reply_to_fk" FOREIGN KEY ("reply_to_message_id") REFERENCES "public"."church_group_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_group_message_reactions" ADD CONSTRAINT "church_group_message_reactions_message_id_church_group_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."church_group_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_group_message_reactions" ADD CONSTRAINT "church_group_message_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_group_message_reactions" ADD CONSTRAINT "church_group_message_reactions_church_org_fk" FOREIGN KEY ("church_id","organization_id") REFERENCES "public"."churches"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_group_message_reports" ADD CONSTRAINT "church_group_message_reports_message_id_church_group_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."church_group_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_group_message_reports" ADD CONSTRAINT "church_group_message_reports_reporter_user_id_users_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_group_message_reports" ADD CONSTRAINT "church_group_message_reports_church_org_fk" FOREIGN KEY ("church_id","organization_id") REFERENCES "public"."churches"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "church_group_messages_group_created_idx" ON "church_group_messages" USING btree ("group_id","created_at");--> statement-breakpoint
CREATE INDEX "church_group_messages_org_church_group_idx" ON "church_group_messages" USING btree ("organization_id","church_id","group_id");--> statement-breakpoint
CREATE INDEX "church_group_messages_user_id_idx" ON "church_group_messages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "church_group_messages_deleted_at_idx" ON "church_group_messages" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "church_group_messages_reply_to_idx" ON "church_group_messages" USING btree ("reply_to_message_id");--> statement-breakpoint
CREATE UNIQUE INDEX "church_group_message_reactions_unique" ON "church_group_message_reactions" USING btree ("message_id","user_id","reaction_type");--> statement-breakpoint
CREATE INDEX "church_group_message_reactions_message_idx" ON "church_group_message_reactions" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "church_group_message_reactions_group_idx" ON "church_group_message_reactions" USING btree ("organization_id","church_id","group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "church_group_message_reports_unique" ON "church_group_message_reports" USING btree ("message_id","reporter_user_id");--> statement-breakpoint
CREATE INDEX "church_group_message_reports_message_idx" ON "church_group_message_reports" USING btree ("message_id");
