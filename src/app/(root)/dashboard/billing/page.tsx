import { Suspense } from "react";

import { AdminBillingPageClient } from "@/components/admin/pages/admin-billing-page";
import { DashboardPageSkeleton } from "@/components/skeletons/dashboard-page-skeleton";

export const metadata = {
  title: "Billing",
  description: "Church subscription, usage, and plan management.",
};

export default function AdminBillingPage() {
  return (
    <Suspense fallback={<DashboardPageSkeleton />}>
      <AdminBillingPageClient />
    </Suspense>
  );
}
