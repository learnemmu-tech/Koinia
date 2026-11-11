import { AdminBillingPageClient } from "@/components/admin/pages/admin-billing-page";

export const metadata = {
  title: "Spending",
  description: "Confirmed subscription charges and the next catalog renewal.",
};

export default function BillingSpendingPage() {
  return <AdminBillingPageClient section="spending" />;
}
