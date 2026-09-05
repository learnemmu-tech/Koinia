CREATE TYPE "public"."billing_interval" AS ENUM('monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."church_membership_role" AS ENUM('church_admin', 'leader', 'editor', 'member', 'volunteer');--> statement-breakpoint
CREATE TYPE "public"."church_membership_status" AS ENUM('pending', 'active', 'rejected', 'suspended', 'removed', 'invited');--> statement-breakpoint
CREATE TYPE "public"."donation_campaign_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."donation_currency" AS ENUM('INR', 'USD');--> statement-breakpoint
CREATE TYPE "public"."enrollment_mode" AS ENUM('open', 'approval_required', 'invite_only', 'closed');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('Sunday Service', 'Prayer Meeting', 'Youth Fellowship', 'Bible Study', 'Conference', 'Special Event', 'Other');--> statement-breakpoint
CREATE TYPE "public"."favorite_item_type" AS ENUM('song', 'sermon', 'article', 'event');--> statement-breakpoint
CREATE TYPE "public"."invitation_delivery_method" AS ENUM('email', 'link');--> statement-breakpoint
CREATE TYPE "public"."invitation_role" AS ENUM('org_admin', 'church_admin', 'leader', 'editor', 'member', 'volunteer');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('song', 'article', 'sermon', 'event', 'prayer', 'prayer_request_submitted', 'membership_approved');--> statement-breakpoint
CREATE TYPE "public"."organization_membership_role" AS ENUM('owner', 'org_admin');--> statement-breakpoint
CREATE TYPE "public"."organization_membership_status" AS ENUM('active', 'invited', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."organization_status" AS ENUM('active', 'suspended', 'trial');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('stripe', 'razorpay');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."plan_id" AS ENUM('free', 'starter', 'professional', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."platform_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."prayer_request_category" AS ENUM('general', 'health', 'family', 'finances', 'salvation', 'guidance', 'thanksgiving', 'other');--> statement-breakpoint
CREATE TYPE "public"."prayer_request_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."recently_viewed_item_type" AS ENUM('song', 'sermon', 'article');--> statement-breakpoint
CREATE TYPE "public"."song_category" AS ENUM('Worship', 'Praise', 'Christmas', 'Easter', 'Youth', 'Choir', 'Special Event');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'trialing', 'past_due', 'canceled', 'incomplete');--> statement-breakpoint
CREATE TYPE "public"."workspace_type" AS ENUM('independent_church', 'multi_church_org');--> statement-breakpoint
CREATE TABLE "church_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"church_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "church_membership_role" DEFAULT 'member' NOT NULL,
	"status" "church_membership_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "church_memberships_church_user_unique" UNIQUE("church_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "churches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"join_slug" text NOT NULL,
	"retired_join_slugs" text[] DEFAULT '{}'::text[] NOT NULL,
	"enrollment_mode" "enrollment_mode" DEFAULT 'approval_required' NOT NULL,
	"join_url_enabled" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"description" text,
	"logo_url" text,
	"banner_url" text,
	"address" text,
	"city" text,
	"state" text,
	"country" text,
	"phone" text,
	"email" text,
	"website" text,
	"pastor_name" text,
	"established_year" integer,
	"timezone" text,
	"currency" text DEFAULT 'USD',
	"denomination" text,
	"church_type" text,
	"default_language" text,
	"show_donations" boolean DEFAULT true NOT NULL,
	"show_events" boolean DEFAULT true NOT NULL,
	"show_prayer_wall" boolean DEFAULT true NOT NULL,
	"primary_color" text,
	"secondary_color" text,
	"welcome_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "churches_join_slug_unique" UNIQUE("join_slug"),
	CONSTRAINT "churches_id_organization_id_unique" UNIQUE("id","organization_id"),
	CONSTRAINT "churches_organization_id_slug_unique" UNIQUE("organization_id","slug")
);
--> statement-breakpoint
CREATE TABLE "organization_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "organization_membership_role" NOT NULL,
	"status" "organization_membership_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_memberships_org_user_unique" UNIQUE("organization_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	"description" text,
	"owner_id" uuid NOT NULL,
	"status" "organization_status" DEFAULT 'active' NOT NULL,
	"workspace_type" "workspace_type" DEFAULT 'independent_church' NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" text,
	"email" text NOT NULL,
	"email_verified_at" timestamp with time zone,
	"first_name" text DEFAULT '' NOT NULL,
	"last_name" text DEFAULT '' NOT NULL,
	"platform_role" "platform_role" DEFAULT 'user' NOT NULL,
	"organization_id" uuid,
	"active_church_id" uuid,
	"pending_church_id" uuid,
	"needs_church_onboarding" boolean DEFAULT true NOT NULL,
	"onboarding_completed_at" timestamp with time zone,
	"email_preferences" jsonb DEFAULT '{"song":true,"sermon":true,"article":true,"event":true,"donation":true,"prayer":true}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"church_id" uuid NOT NULL,
	"role" "invitation_role" NOT NULL,
	"email" text,
	"delivery_method" "invitation_delivery_method" NOT NULL,
	"token" text NOT NULL,
	"invited_by" uuid NOT NULL,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"accepted_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"plan_id" "plan_id" DEFAULT 'free' NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"billing_interval" "billing_interval",
	"trial_start" timestamp with time zone,
	"trial_end" timestamp with time zone,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"feature_flags" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"usage" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"church_id" uuid NOT NULL,
	"title" text NOT NULL,
	"category" text DEFAULT 'Christian Living' NOT NULL,
	"short_description" text DEFAULT '' NOT NULL,
	"scripture_reference" text,
	"content" text DEFAULT '' NOT NULL,
	"cover_image" text,
	"author" text DEFAULT '' NOT NULL,
	"author_image" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"youtube_url" text,
	"featured" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sermons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"church_id" uuid NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"scripture_reference" text DEFAULT '' NOT NULL,
	"speaker" text DEFAULT '' NOT NULL,
	"short_description" text DEFAULT '' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"youtube_url" text,
	"audio_url" text,
	"cover_image" text,
	"created_by" uuid,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "songs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"church_id" uuid NOT NULL,
	"song_title" text NOT NULL,
	"alternate_title" text,
	"artist" text,
	"category" "song_category" DEFAULT 'Worship' NOT NULL,
	"original_lyrics" text DEFAULT '' NOT NULL,
	"translation_lyrics" text,
	"scripture_reference" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"image_url" text,
	"audio_url" text,
	"youtube_url" text,
	"play_count" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"church_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"user_email" text NOT NULL,
	"user_name" text DEFAULT 'Guest' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_registrations_event_user_unique" UNIQUE("event_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"church_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"banner_image" text,
	"event_type" "event_type" DEFAULT 'Other' NOT NULL,
	"speaker_name" text DEFAULT '' NOT NULL,
	"event_date" date NOT NULL,
	"event_time" text DEFAULT '' NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"status" "event_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prayer_intercessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prayer_request_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prayer_intercessions_request_user_unique" UNIQUE("prayer_request_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "prayer_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"church_id" uuid NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"email" text,
	"title" text NOT NULL,
	"request" text NOT NULL,
	"category" "prayer_request_category" DEFAULT 'general' NOT NULL,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"share_with_community" boolean DEFAULT true NOT NULL,
	"is_answered" boolean DEFAULT false NOT NULL,
	"answered_at" timestamp with time zone,
	"status" "prayer_request_status" DEFAULT 'pending' NOT NULL,
	"prayer_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "donation_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"church_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"banner_image" text,
	"target_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"current_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"currency" "donation_currency" DEFAULT 'INR' NOT NULL,
	"status" "donation_campaign_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "donations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"church_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"donor_name" text NOT NULL,
	"donor_email" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" "donation_currency" NOT NULL,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"payment_provider" "payment_provider" NOT NULL,
	"transaction_id" text NOT NULL,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_reads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notification_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_reads_notification_user_unique" UNIQUE("notification_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"church_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"content_title" text DEFAULT '' NOT NULL,
	"image" text,
	"content_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"item_type" "favorite_item_type" NOT NULL,
	"item_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favorites_user_item_unique" UNIQUE("user_id","item_type","item_id")
);
--> statement-breakpoint
CREATE TABLE "recently_viewed" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"item_type" "recently_viewed_item_type" NOT NULL,
	"item_id" uuid NOT NULL,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recently_viewed_user_item_unique" UNIQUE("user_id","item_type","item_id")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"action" text NOT NULL,
	"organization_id" uuid,
	"church_id" uuid,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "church_memberships" ADD CONSTRAINT "church_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_memberships" ADD CONSTRAINT "church_memberships_church_organization_fk" FOREIGN KEY ("church_id","organization_id") REFERENCES "public"."churches"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "churches" ADD CONSTRAINT "churches_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_active_church_id_churches_id_fk" FOREIGN KEY ("active_church_id") REFERENCES "public"."churches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_pending_church_id_churches_id_fk" FOREIGN KEY ("pending_church_id") REFERENCES "public"."churches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_accepted_by_users_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_church_organization_fk" FOREIGN KEY ("church_id","organization_id") REFERENCES "public"."churches"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_church_organization_fk" FOREIGN KEY ("church_id","organization_id") REFERENCES "public"."churches"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sermons" ADD CONSTRAINT "sermons_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sermons" ADD CONSTRAINT "sermons_church_organization_fk" FOREIGN KEY ("church_id","organization_id") REFERENCES "public"."churches"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "songs" ADD CONSTRAINT "songs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "songs" ADD CONSTRAINT "songs_church_organization_fk" FOREIGN KEY ("church_id","organization_id") REFERENCES "public"."churches"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_church_organization_fk" FOREIGN KEY ("church_id","organization_id") REFERENCES "public"."churches"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_church_organization_fk" FOREIGN KEY ("church_id","organization_id") REFERENCES "public"."churches"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_intercessions" ADD CONSTRAINT "prayer_intercessions_prayer_request_id_prayer_requests_id_fk" FOREIGN KEY ("prayer_request_id") REFERENCES "public"."prayer_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_intercessions" ADD CONSTRAINT "prayer_intercessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_requests" ADD CONSTRAINT "prayer_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_requests" ADD CONSTRAINT "prayer_requests_church_organization_fk" FOREIGN KEY ("church_id","organization_id") REFERENCES "public"."churches"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donation_campaigns" ADD CONSTRAINT "donation_campaigns_church_organization_fk" FOREIGN KEY ("church_id","organization_id") REFERENCES "public"."churches"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_campaign_id_donation_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."donation_campaigns"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_church_organization_fk" FOREIGN KEY ("church_id","organization_id") REFERENCES "public"."churches"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_church_organization_fk" FOREIGN KEY ("church_id","organization_id") REFERENCES "public"."churches"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recently_viewed" ADD CONSTRAINT "recently_viewed_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_church_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "church_memberships_user_id_status_idx" ON "church_memberships" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "church_memberships_church_id_status_idx" ON "church_memberships" USING btree ("church_id","status");--> statement-breakpoint
CREATE INDEX "church_memberships_organization_id_user_id_idx" ON "church_memberships" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "churches_organization_id_idx" ON "churches" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "churches_is_active_idx" ON "churches" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "churches_retired_join_slugs_idx" ON "churches" USING gin ("retired_join_slugs");--> statement-breakpoint
CREATE INDEX "organization_memberships_user_id_status_idx" ON "organization_memberships" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "organization_memberships_organization_id_idx" ON "organization_memberships" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organizations_owner_id_idx" ON "organizations" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "organizations_workspace_type_idx" ON "organizations" USING btree ("workspace_type");--> statement-breakpoint
CREATE INDEX "users_organization_id_idx" ON "users" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "users_active_church_id_idx" ON "users" USING btree ("active_church_id");--> statement-breakpoint
CREATE INDEX "users_pending_church_id_idx" ON "users" USING btree ("pending_church_id");--> statement-breakpoint
CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "invitations_pending_email_church_unique" ON "invitations" USING btree ("church_id","email") WHERE "invitations"."status" = 'pending' AND "invitations"."email" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "invitations_organization_id_created_at_idx" ON "invitations" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "invitations_church_id_status_idx" ON "invitations" USING btree ("church_id","status");--> statement-breakpoint
CREATE INDEX "subscriptions_status_idx" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscriptions_stripe_customer_id_idx" ON "subscriptions" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "articles_church_id_created_at_idx" ON "articles" USING btree ("church_id","created_at");--> statement-breakpoint
CREATE INDEX "articles_organization_id_church_id_idx" ON "articles" USING btree ("organization_id","church_id");--> statement-breakpoint
CREATE INDEX "articles_church_id_is_published_idx" ON "articles" USING btree ("church_id","is_published");--> statement-breakpoint
CREATE INDEX "sermons_church_id_created_at_idx" ON "sermons" USING btree ("church_id","created_at");--> statement-breakpoint
CREATE INDEX "sermons_organization_id_church_id_idx" ON "sermons" USING btree ("organization_id","church_id");--> statement-breakpoint
CREATE INDEX "sermons_church_id_is_published_idx" ON "sermons" USING btree ("church_id","is_published");--> statement-breakpoint
CREATE INDEX "songs_church_id_created_at_idx" ON "songs" USING btree ("church_id","created_at");--> statement-breakpoint
CREATE INDEX "songs_organization_id_church_id_idx" ON "songs" USING btree ("organization_id","church_id");--> statement-breakpoint
CREATE INDEX "songs_church_id_published_idx" ON "songs" USING btree ("church_id","published");--> statement-breakpoint
CREATE INDEX "event_registrations_user_id_idx" ON "event_registrations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "event_registrations_church_id_created_at_idx" ON "event_registrations" USING btree ("church_id","created_at");--> statement-breakpoint
CREATE INDEX "events_church_id_event_date_idx" ON "events" USING btree ("church_id","event_date");--> statement-breakpoint
CREATE INDEX "events_church_id_status_event_date_idx" ON "events" USING btree ("church_id","status","event_date");--> statement-breakpoint
CREATE INDEX "events_organization_id_church_id_idx" ON "events" USING btree ("organization_id","church_id");--> statement-breakpoint
CREATE INDEX "prayer_intercessions_user_id_idx" ON "prayer_intercessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "prayer_requests_church_id_created_at_idx" ON "prayer_requests" USING btree ("church_id","created_at");--> statement-breakpoint
CREATE INDEX "prayer_requests_church_id_status_created_at_idx" ON "prayer_requests" USING btree ("church_id","status","created_at");--> statement-breakpoint
CREATE INDEX "prayer_requests_user_id_created_at_idx" ON "prayer_requests" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "prayer_requests_organization_id_church_id_idx" ON "prayer_requests" USING btree ("organization_id","church_id");--> statement-breakpoint
CREATE INDEX "donation_campaigns_church_id_created_at_idx" ON "donation_campaigns" USING btree ("church_id","created_at");--> statement-breakpoint
CREATE INDEX "donation_campaigns_church_id_status_created_at_idx" ON "donation_campaigns" USING btree ("church_id","status","created_at");--> statement-breakpoint
CREATE INDEX "donation_campaigns_organization_id_church_id_idx" ON "donation_campaigns" USING btree ("organization_id","church_id");--> statement-breakpoint
CREATE INDEX "donations_church_id_created_at_idx" ON "donations" USING btree ("church_id","created_at");--> statement-breakpoint
CREATE INDEX "donations_church_id_payment_status_created_at_idx" ON "donations" USING btree ("church_id","payment_status","created_at");--> statement-breakpoint
CREATE INDEX "donations_donor_email_created_at_idx" ON "donations" USING btree ("donor_email","created_at");--> statement-breakpoint
CREATE INDEX "donations_campaign_id_idx" ON "donations" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "donations_transaction_id_idx" ON "donations" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "donations_organization_id_church_id_idx" ON "donations" USING btree ("organization_id","church_id");--> statement-breakpoint
CREATE INDEX "notification_reads_user_id_idx" ON "notification_reads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_church_id_created_at_idx" ON "notifications" USING btree ("church_id","created_at");--> statement-breakpoint
CREATE INDEX "favorites_user_id_created_at_idx" ON "favorites" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "recently_viewed_user_id_viewed_at_idx" ON "recently_viewed" USING btree ("user_id","viewed_at");--> statement-breakpoint
CREATE INDEX "audit_logs_organization_id_created_at_idx" ON "audit_logs" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_church_id_created_at_idx" ON "audit_logs" USING btree ("church_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_user_id_created_at_idx" ON "audit_logs" USING btree ("actor_user_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs" USING btree ("entity_type","entity_id");