import { Suspense } from "react";

import { AdminContentManagementClient } from "@/components/admin/pages/admin-content-management";
import { DashboardPageSkeleton } from "@/components/skeletons/dashboard-page-skeleton";

export default function AdminContentManagementPage() {
  return (
    <Suspense fallback={<DashboardPageSkeleton />}>
      <AdminContentManagementClient />
    </Suspense>
  );
}
