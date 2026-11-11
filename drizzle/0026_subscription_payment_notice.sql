ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'subscription';
ALTER TABLE "billing_receipts" ADD COLUMN IF NOT EXISTS "confirmation_sent_at" timestamptz;
