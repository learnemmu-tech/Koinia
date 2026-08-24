import { Suspense } from "react";

import { AdminUsersPageClient } from "@/components/admin/pages/admin-users-page";
import { DashboardPageSkeleton } from "@/components/skeletons/dashboard-page-skeleton";

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<DashboardPageSkeleton />}>
      <AdminUsersPageClient />
    </Suspense>
  );
}
