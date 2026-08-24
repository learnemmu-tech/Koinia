import { RequireAuth } from "@/components/auth/require-auth";
import { DashboardPageClient } from "@/components/profile/dashboard/dashboard-page-client";
import { getPageTenantContext } from "@/lib/church-page-data";
import { getUpcomingEventsCached } from "@/lib/cached-event-data";

export const metadata = {
  title: "Dashboard",
  description: "Your personalized activity overview",
};

export default async function DashboardPage() {
  const { scope } = await getPageTenantContext();
  const initialEvents = await getUpcomingEventsCached(scope);

  return (
    <RequireAuth>
      <DashboardPageClient initialEvents={initialEvents} />
    </RequireAuth>
  );
}
