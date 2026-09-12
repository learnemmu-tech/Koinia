import { Suspense } from "react";

import { AdminOrganizationPageClient } from "@/components/admin/pages/admin-organization-page";
import { ContentAreaLoading } from "@/components/content-area-loading";

export const metadata = {
  title: "Admin · Organization",
  description: "Manage organization, churches, and branches in FaithConnectHub.",
};

export default function AdminOrganizationPage() {
  return (
    <Suspense fallback={<ContentAreaLoading />}>
      <AdminOrganizationPageClient />
    </Suspense>
  );
}
