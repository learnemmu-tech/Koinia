import dynamic from "next/dynamic";

import { DashboardPageSkeleton } from "@/components/skeletons/dashboard-page-skeleton";

const AdminMembersPageClient = dynamic(
  () =>
    import("@/components/admin/pages/admin-members-page").then(
      (mod) => mod.AdminMembersPageClient
    ),
  { loading: () => <DashboardPageSkeleton /> }
);

export const metadata = {
  title: "Members",
};

export default function MembersPage() {
  return <AdminMembersPageClient />;
}
