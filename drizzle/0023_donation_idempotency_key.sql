ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "idempotency_key" text;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "donations_idempotency_key_unique" ON "donations" ("idempotency_key");
