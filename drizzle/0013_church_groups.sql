CREATE TYPE "public"."church_group_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."church_group_invitation_status" AS ENUM('pending', 'accepted', 'declined');--> statement-breakpoint
ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'group_invitation';--> statement-breakpoint
CREATE TABLE "church_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"church_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"image_url" text,
	"invite_token" text NOT NULL,
	"status" "church_group_status" DEFAULT 'active' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "church_groups_invite_token_unique" UNIQUE("invite_token")
);--> statement-breakpoint
CREATE TABLE "church_group_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"church_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "church_group_memberships_group_user_unique" UNIQUE("group_id","user_id")
);--> statement-breakpoint
CREATE TABLE "church_group_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"church_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"invited_by" uuid NOT NULL,
	"status" "church_group_invitation_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone
);--> statement-breakpoint
ALTER TABLE "church_groups" ADD CONSTRAINT "church_groups_church_organization_fk" FOREIGN KEY ("church_id","organization_id") REFERENCES "public"."churches"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_groups" ADD CONSTRAINT "church_groups_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_group_memberships" ADD CONSTRAINT "church_group_memberships_group_id_church_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."church_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_group_memberships" ADD CONSTRAINT "church_group_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_group_memberships" ADD CONSTRAINT "church_group_memberships_church_organization_fk" FOREIGN KEY ("church_id","organization_id") REFERENCES "public"."churches"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_group_invitations" ADD CONSTRAINT "church_group_invitations_group_id_church_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."church_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_group_invitations" ADD CONSTRAINT "church_group_invitations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_group_invitations" ADD CONSTRAINT "church_group_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_group_invitations" ADD CONSTRAINT "church_group_invitations_church_organization_fk" FOREIGN KEY ("church_id","organization_id") REFERENCES "public"."churches"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "church_groups_organization_id_idx" ON "church_groups" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "church_groups_church_id_status_idx" ON "church_groups" USING btree ("church_id","status");--> statement-breakpoint
CREATE INDEX "church_group_memberships_user_id_idx" ON "church_group_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "church_group_memberships_organization_id_idx" ON "church_group_memberships" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "church_group_invitations_pending_group_user_unique" ON "church_group_invitations" USING btree ("group_id","user_id") WHERE "status" = 'pending';--> statement-breakpoint
CREATE INDEX "church_group_invitations_user_id_status_idx" ON "church_group_invitations" USING btree ("user_id","status");
