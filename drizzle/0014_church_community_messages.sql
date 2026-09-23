CREATE TABLE "church_community_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"church_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);--> statement-breakpoint
ALTER TABLE "church_community_messages" ADD CONSTRAINT "church_community_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_community_messages" ADD CONSTRAINT "church_community_messages_church_organization_fk" FOREIGN KEY ("church_id","organization_id") REFERENCES "public"."churches"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "church_community_messages_church_created_idx" ON "church_community_messages" USING btree ("church_id","created_at");--> statement-breakpoint
CREATE INDEX "church_community_messages_org_church_idx" ON "church_community_messages" USING btree ("organization_id","church_id");--> statement-breakpoint
CREATE INDEX "church_community_messages_user_id_idx" ON "church_community_messages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "church_community_messages_deleted_at_idx" ON "church_community_messages" USING btree ("deleted_at");
