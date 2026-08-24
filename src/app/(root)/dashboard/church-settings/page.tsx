import { Suspense } from "react";

import { AdminChurchSettingsPageClient } from "@/components/admin/pages/admin-church-settings-page";
import { DashboardPageSkeleton } from "@/components/skeletons/dashboard-page-skeleton";

export const metadata = {
  title: "Church Settings",
};

export default function ChurchSettingsPage() {
  return (
    <Suspense fallback={<DashboardPageSkeleton />}>
      <AdminChurchSettingsPageClient />
    </Suspense>
  );
}
