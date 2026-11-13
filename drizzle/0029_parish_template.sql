ALTER TABLE "church_websites" DROP CONSTRAINT "church_websites_active_template_check";

ALTER TABLE "church_websites" ADD CONSTRAINT "church_websites_active_template_check" CHECK (
  "active_template" IN ('signature', 'heritage', 'parish', 'sanctuary')
);
