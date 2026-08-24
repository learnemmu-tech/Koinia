import { Suspense } from "react";

import { AdminChurchesPageClient } from "@/components/admin/pages/admin-churches-page";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Admin · Churches",
  description: "Manage churches in FaithConnectHub admin.",
};

export default function AdminChurchesPage() {
  return (
    <Suspense
      fallback={<Skeleton className="mx-4 my-8 h-64 rounded-2xl sm:mx-6" />}
    >
      <AdminChurchesPageClient />
    </Suspense>
  );
}
