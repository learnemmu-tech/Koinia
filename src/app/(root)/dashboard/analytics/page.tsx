import { Suspense } from "react";

import { AdminAnalyticsDashboard } from "@/components/admin/analytics/admin-analytics-dashboard";
import { DashboardPageSkeleton } from "@/components/skeletons/dashboard-page-skeleton";

export const metadata = {
  title: "Admin Analytics",
  description: "Platform insights and engagement metrics for church administrators.",
};

export default function AdminAnalyticsPage() {
  return (
    <Suspense fallback={<DashboardPageSkeleton />}>
      <AdminAnalyticsDashboard />
    </Suspense>
  );
}
