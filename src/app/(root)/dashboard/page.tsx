import { Suspense } from "react";

import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { DashboardPageSkeleton } from "@/components/skeletons/dashboard-page-skeleton";

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<DashboardPageSkeleton />}>
      <AdminDashboard />
    </Suspense>
  );
}
