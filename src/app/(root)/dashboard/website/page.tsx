import { Suspense } from "react";

import { AdminWebsitePageClient } from "@/components/admin/pages/admin-website-page";
import { DashboardPageSkeleton } from "@/components/skeletons/dashboard-page-skeleton";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata(
  "Website",
  "Manage the public church website template, branding, and SEO."
);

export default function AdminWebsitePage() {
  return (
    <Suspense fallback={<DashboardPageSkeleton />}>
      <AdminWebsitePageClient />
    </Suspense>
  );
}
