import { AdminBillingPageClient } from "@/components/admin/pages/admin-billing-page";

export const metadata = {
  title: "Billing & Invoices",
  description: "Payment receipts for confirmed charges.",
};

export default function BillingInvoicesPage() {
  return <AdminBillingPageClient section="invoices" />;
}
