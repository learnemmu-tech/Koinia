import { AdminBillingPageClient } from "@/components/admin/pages/admin-billing-page";

export const metadata = {
  title: "Plans & Usage",
  description: "Usage, feature access, and plan options.",
};

export default function BillingPlansPage() {
  return <AdminBillingPageClient section="plans" />;
}
