CREATE TABLE IF NOT EXISTS "billing_receipts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "provider" text DEFAULT 'razorpay' NOT NULL,
  "provider_payment_id" text NOT NULL,
  "provider_invoice_id" text,
  "provider_subscription_id" text,
  "receipt_number" text NOT NULL,
  "description" text NOT NULL,
  "amount_minor" integer NOT NULL,
  "currency" text NOT NULL,
  "status" text NOT NULL,
  "paid_at" timestamp with time zone,
  "plan_id" "plan_id",
  "period_start" timestamp with time zone,
  "period_end" timestamp with time zone,
  "customer_name" text,
  "customer_email" text,
  "payment_method_summary" text,
  "document_status" text DEFAULT 'ready' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "billing_receipts" ADD CONSTRAINT "billing_receipts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "billing_receipts_provider_payment_unique" ON "billing_receipts" USING btree ("provider","provider_payment_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "billing_receipts_organization_id_idx" ON "billing_receipts" USING btree ("organization_id");
