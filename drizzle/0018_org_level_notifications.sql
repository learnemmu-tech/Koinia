ALTER TABLE "notifications"
  ALTER COLUMN "church_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_organization_id_organizations_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id")
  ON DELETE cascade ON UPDATE no action;
