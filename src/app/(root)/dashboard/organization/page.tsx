import { Suspense } from "react";

import { AdminOrganizationPageClient } from "@/components/admin/pages/admin-organization-page";
import { DashboardPageSkeleton } from "@/components/skeletons/dashboard-page-skeleton";

export const metadata = {
  title: "Admin · Organization",
  description: "Manage organization, churches, and branches in FaithConnectHub.",
};

export default function AdminOrganizationPage() {
  return (
    <Suspense fallback={<DashboardPageSkeleton />}>
      <AdminOrganizationPageClient />
    </Suspense>
  );
}
