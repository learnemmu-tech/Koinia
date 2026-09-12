import { Suspense } from "react";

import { AdminChurchesPageClient } from "@/components/admin/pages/admin-churches-page";
import { ContentAreaLoading } from "@/components/content-area-loading";

export const metadata = {
  title: "Admin · Churches",
  description: "Manage churches in FaithConnectHub admin.",
};

export default function AdminChurchesPage() {
  return (
    <Suspense fallback={<ContentAreaLoading />}>
      <AdminChurchesPageClient />
    </Suspense>
  );
}
