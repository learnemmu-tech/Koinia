import { Suspense } from "react";

import { AdminOrganizationPageClient } from "@/components/admin/pages/admin-organization-page";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Admin · Organization",
  description: "Manage organization, churches, and branches in FaithConnectHub.",
};

export default function AdminOrganizationPage() {
  return (
    <Suspense
      fallback={<Skeleton className="mx-4 my-8 h-64 rounded-2xl sm:mx-6" />}
    >
      <AdminOrganizationPageClient />
    </Suspense>
  );
}
