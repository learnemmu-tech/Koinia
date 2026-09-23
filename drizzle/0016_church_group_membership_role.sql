CREATE TYPE "public"."church_group_member_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
ALTER TABLE "church_group_memberships" ADD COLUMN "role" "church_group_member_role" DEFAULT 'member' NOT NULL;--> statement-breakpoint
UPDATE "church_group_memberships" AS m
SET "role" = 'owner'
FROM "church_groups" AS g
WHERE m."group_id" = g."id"
  AND g."created_by" IS NOT NULL
  AND m."user_id" = g."created_by";
