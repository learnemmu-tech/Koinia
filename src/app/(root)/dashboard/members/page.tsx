import { Suspense } from "react";

import { AdminMembersPageClient } from "@/components/admin/pages/admin-members-page";
import { DashboardPageSkeleton } from "@/components/skeletons/dashboard-page-skeleton";

export const metadata = {
  title: "Members",
};

export default function MembersPage() {
  return (
    <Suspense fallback={<DashboardPageSkeleton />}>
      <AdminMembersPageClient />
    </Suspense>
  );
}
