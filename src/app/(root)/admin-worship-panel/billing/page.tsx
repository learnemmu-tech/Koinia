import { AdminBillingPageClient } from "@/components/admin/pages/admin-billing-page";

export const metadata = {
  title: "Billing",
  description: "Church subscription, usage, and plan management.",
};

export default function AdminBillingPage() {
  return <AdminBillingPageClient />;
}
