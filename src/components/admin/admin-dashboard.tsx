"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  FileText,
  ListMusic,
  Mic2,
  Users,
} from "lucide-react";

import { MultiOrgDashboard } from "@/components/admin/multi-org-dashboard";
import { WelcomeCard } from "@/components/admin/welcome-card";
import { DashboardBranchSwitcher } from "@/components/dashboard/dashboard-branch-switcher";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PlanBadgeFromContext } from "@/components/subscription/plan-badge-from-context";
import { adminSectionClass } from "@/lib/responsive-classes";
import {
  AnalyticsRecentLists,
} from "@/components/admin/analytics/analytics-recent-lists";
import {
  AnalyticsStatCards,
  type AnalyticsStatDefinition,
} from "@/components/admin/analytics/analytics-stat-cards";
import { useAdminAnalytics } from "@/hooks/use-admin-analytics";
import { useAdminChurchBlocked } from "@/hooks/use-admin-collections";
import { DashboardQueryPrefetch } from "@/components/admin/dashboard-query-prefetch";
import { useOrganization } from "@/context/organization-context";
import { isMultiChurchOrgWorkspace } from "@/lib/organization/workspace-type";

const TAB_REDIRECTS: Record<string, string> = {
  songs: "/dashboard/content?tab=songs",
  sermons: "/dashboard/content?tab=sermons",
  articles: "/dashboard/content?tab=articles",
  events: "/dashboard/content?tab=events",
  donations: "/dashboard/content?tab=donations",
  prayers: "/dashboard/content?tab=prayers",
  churches: "/dashboard/churches",
};

export function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { organization } = useOrganization();
  const isMultiOrg = isMultiChurchOrgWorkspace(organization);
  const analytics = useAdminAnalytics();
  const blocked = useAdminChurchBlocked();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && TAB_REDIRECTS[tab]) {
      router.replace(TAB_REDIRECTS[tab]);
    }
  }, [router, searchParams]);

  if (isMultiOrg) {
    return <MultiOrgDashboard />;
  }

  const statCards: AnalyticsStatDefinition[] = [
    {
      key: "songs",
      label: "Songs",
      value: analytics.counts.songs,
      icon: ListMusic,
    },
    {
      key: "sermons",
      label: "Sermons",
      value: analytics.counts.sermons,
      icon: Mic2,
    },
    {
      key: "articles",
      label: "Articles",
      value: analytics.counts.articles,
      icon: FileText,
    },
    {
      key: "events",
      label: "Events",
      value: analytics.counts.events,
      icon: CalendarDays,
    },
    {
      key: "users",
      label: "Members",
      value: analytics.counts.users,
      icon: Users,
    },
  ];

  return (
    <div className={adminSectionClass}>
      <DashboardQueryPrefetch />
      <AdminPageHeader
        eyebrow="Overview"
        title="Dashboard"
        description={`${analytics.scopeLabel} · ministry overview`}
      >
        <DashboardBranchSwitcher />
        <PlanBadgeFromContext />
      </AdminPageHeader>

      <WelcomeCard />

      {blocked ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          Your church workspace is still loading. Select a church to view
          analytics and manage content.
        </div>
      ) : null}

      <AnalyticsStatCards
        stats={statCards}
        loading={analytics.loading || analytics.insightsLoading}
      />

      <AnalyticsRecentLists
        recentUsers={analytics.recentUsers}
        recentDonations={analytics.recentDonations}
        loading={analytics.loading}
        insightsLoading={analytics.insightsLoading}
      />
    </div>
  );
}
