import { Suspense } from "react";

import { AdminChurchesPageClient } from "@/components/admin/pages/admin-churches-page";
import { DashboardPageSkeleton } from "@/components/skeletons/dashboard-page-skeleton";

export const metadata = {
  title: "Admin · Churches",
  description: "Manage churches in FaithConnectHub admin.",
};

export default function AdminChurchesPage() {
  return (
    <Suspense fallback={<DashboardPageSkeleton />}>
      <AdminChurchesPageClient />
    </Suspense>
  );
}
