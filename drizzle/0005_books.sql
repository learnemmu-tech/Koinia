CREATE TYPE "public"."book_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."book_visibility" AS ENUM('public', 'members_only');--> statement-breakpoint
CREATE TYPE "public"."book_type" AS ENUM('digital', 'physical', 'both');--> statement-breakpoint
CREATE TYPE "public"."book_digital_access_mode" AS ENUM('free', 'paid');--> statement-breakpoint
CREATE TYPE "public"."book_digital_entitlement_source" AS ENUM('purchase', 'grant');--> statement-breakpoint
CREATE TYPE "public"."book_order_payment_status" AS ENUM('pending', 'paid', 'failed', 'refunded', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."book_order_fulfillment_status" AS ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TABLE "books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"church_id" uuid NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"author_name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"cover_image_url" text,
	"status" "book_status" DEFAULT 'draft' NOT NULL,
	"visibility" "book_visibility" DEFAULT 'public' NOT NULL,
	"book_type" "book_type" NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "book_digital_editions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid NOT NULL,
	"file_object_key" text,
	"file_name" text,
	"file_size" integer,
	"mime_type" text,
	"page_count" integer,
	"access_mode" "book_digital_access_mode" DEFAULT 'free' NOT NULL,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "book_physical_editions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid NOT NULL,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"sku" text,
	"weight_grams" integer,
	"shipping_available" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "book_digital_entitlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"source" "book_digital_entitlement_source" DEFAULT 'grant' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "book_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"church_id" uuid NOT NULL,
	"book_id" uuid NOT NULL,
	"buyer_user_id" uuid,
	"order_number" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"currency" text NOT NULL,
	"subtotal_cents" integer NOT NULL,
	"shipping_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer NOT NULL,
	"payment_status" "book_order_payment_status" DEFAULT 'pending' NOT NULL,
	"fulfillment_status" "book_order_fulfillment_status" DEFAULT 'pending' NOT NULL,
	"shipping_name" text NOT NULL,
	"shipping_phone" text NOT NULL,
	"address_line1" text NOT NULL,
	"address_line2" text,
	"city" text NOT NULL,
	"region" text NOT NULL,
	"postal_code" text NOT NULL,
	"country" text NOT NULL,
	"tracking_number" text,
	"tracking_url" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_church_organization_fk" FOREIGN KEY ("church_id","organization_id") REFERENCES "public"."churches"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_digital_editions" ADD CONSTRAINT "book_digital_editions_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_physical_editions" ADD CONSTRAINT "book_physical_editions_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_digital_entitlements" ADD CONSTRAINT "book_digital_entitlements_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_digital_entitlements" ADD CONSTRAINT "book_digital_entitlements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_orders" ADD CONSTRAINT "book_orders_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_orders" ADD CONSTRAINT "book_orders_buyer_user_id_users_id_fk" FOREIGN KEY ("buyer_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_orders" ADD CONSTRAINT "book_orders_church_organization_fk" FOREIGN KEY ("church_id","organization_id") REFERENCES "public"."churches"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_currency_iso_chk" CHECK (currency ~ '^[A-Z]{3}$');--> statement-breakpoint
ALTER TABLE "book_digital_editions" ADD CONSTRAINT "book_digital_editions_currency_iso_chk" CHECK (currency ~ '^[A-Z]{3}$');--> statement-breakpoint
ALTER TABLE "book_digital_editions" ADD CONSTRAINT "book_digital_editions_price_nonnegative_chk" CHECK (price_cents >= 0);--> statement-breakpoint
ALTER TABLE "book_physical_editions" ADD CONSTRAINT "book_physical_editions_currency_iso_chk" CHECK (currency ~ '^[A-Z]{3}$');--> statement-breakpoint
ALTER TABLE "book_physical_editions" ADD CONSTRAINT "book_physical_editions_price_nonnegative_chk" CHECK (price_cents >= 0);--> statement-breakpoint
ALTER TABLE "book_physical_editions" ADD CONSTRAINT "book_physical_editions_stock_nonnegative_chk" CHECK (stock_quantity >= 0);--> statement-breakpoint
ALTER TABLE "book_orders" ADD CONSTRAINT "book_orders_currency_iso_chk" CHECK (currency ~ '^[A-Z]{3}$');--> statement-breakpoint
ALTER TABLE "book_orders" ADD CONSTRAINT "book_orders_quantity_positive_chk" CHECK (quantity > 0);--> statement-breakpoint
ALTER TABLE "book_orders" ADD CONSTRAINT "book_orders_country_iso_chk" CHECK (country ~ '^[A-Z]{2}$');--> statement-breakpoint
CREATE UNIQUE INDEX "books_organization_id_slug_unique" ON "books" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE INDEX "books_organization_id_church_id_idx" ON "books" USING btree ("organization_id","church_id");--> statement-breakpoint
CREATE INDEX "books_church_id_status_idx" ON "books" USING btree ("church_id","status");--> statement-breakpoint
CREATE INDEX "books_status_visibility_idx" ON "books" USING btree ("status","visibility");--> statement-breakpoint
CREATE INDEX "books_created_at_idx" ON "books" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "book_digital_editions_book_id_unique" ON "book_digital_editions" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "book_digital_editions_access_mode_idx" ON "book_digital_editions" USING btree ("access_mode");--> statement-breakpoint
CREATE UNIQUE INDEX "book_physical_editions_book_id_unique" ON "book_physical_editions" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "book_physical_editions_is_active_idx" ON "book_physical_editions" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "book_digital_entitlements_book_user_unique" ON "book_digital_entitlements" USING btree ("book_id","user_id");--> statement-breakpoint
CREATE INDEX "book_digital_entitlements_user_id_idx" ON "book_digital_entitlements" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "book_orders_order_number_unique" ON "book_orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "book_orders_organization_id_created_at_idx" ON "book_orders" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "book_orders_church_id_created_at_idx" ON "book_orders" USING btree ("church_id","created_at");--> statement-breakpoint
CREATE INDEX "book_orders_book_id_idx" ON "book_orders" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "book_orders_buyer_user_id_idx" ON "book_orders" USING btree ("buyer_user_id");--> statement-breakpoint
CREATE INDEX "book_orders_payment_status_idx" ON "book_orders" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "book_orders_fulfillment_status_idx" ON "book_orders" USING btree ("fulfillment_status");
