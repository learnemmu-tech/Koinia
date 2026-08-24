"use client";

import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CalendarDays,
  FileText,
  HeartHandshake,
  ListMusic,
  Loader2,
  Mic2,
  RefreshCw,
  Star,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { ChurchSelector } from "@/components/church/church-selector";
import { adminSectionClass } from "@/lib/responsive-classes";
import {
  AnalyticsDonationsChart,
  AnalyticsContentGrowthChart,
} from "@/components/admin/analytics/analytics-charts";
import {
  AnalyticsInsightCard,
  AnalyticsStatCards,
  type AnalyticsStatDefinition,
} from "@/components/admin/analytics/analytics-stat-cards";
import {
  AnalyticsLoadingBanner,
  AnalyticsRecentLists,
} from "@/components/admin/analytics/analytics-recent-lists";
import { useAdminAnalytics } from "@/hooks/use-admin-analytics";
import { useAdminChurchId, useIsPlatformSuperAdmin } from "@/hooks/use-admin-church-id";
import { MULTI_CHURCH_ENABLED } from "@/lib/feature-flags";

export function AdminAnalyticsDashboard() {
  const adminChurchId = useAdminChurchId();
  const isSuperAdmin = useIsPlatformSuperAdmin();
  const analytics = useAdminAnalytics();

  const statCards: AnalyticsStatDefinition[] = [
    {
      key: "songs",
      label: "Total Songs",
      value: analytics.counts.songs,
      icon: ListMusic,
    },
    {
      key: "sermons",
      label: "Total Sermons",
      value: analytics.counts.sermons,
      icon: Mic2,
    },
    {
      key: "articles",
      label: "Total Articles",
      value: analytics.counts.articles,
      icon: FileText,
    },
    {
      key: "prayers",
      label: "Total Prayer Requests",
      value: analytics.counts.prayerRequests,
      icon: HeartHandshake,
    },
    {
      key: "events",
      label: "Total Events",
      value: analytics.counts.events,
      icon: CalendarDays,
    },
    {
      key: "donations",
      label: "Total Donations",
      value: analytics.counts.donations,
      icon: HeartHandshake,
    },
    {
      key: "users",
      label: "Total Users",
      value: analytics.counts.users,
      icon: Users,
    },
  ];

  const showScopeWarning = !isSuperAdmin && !adminChurchId;

  return (
    <div className={adminSectionClass}>
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
        <div className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/60">
                Admin Analytics
              </p>
              <h1 className="font-heading text-xl font-bold sm:text-2xl">
                Platform Insights
              </h1>
              <p className="text-xs text-muted-foreground">
                {analytics.scopeLabel}
                {analytics.usingInsightsApi ?
                  " · server insights"
                : " · engagement metrics"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={analytics.loading || analytics.insightsLoading}
              onClick={() => analytics.refresh()}
            >
              {analytics.loading || analytics.insightsLoading ?
                <Loader2 className="mr-2 size-4 animate-spin" />
              : <RefreshCw className="mr-2 size-4" />}
              Refresh
            </Button>
            {MULTI_CHURCH_ENABLED && isSuperAdmin ?
              <ChurchSelector compact />
            : null}
            <Link
              href="/dashboard"
              className="rounded-full border border-border/60 px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>

      {showScopeWarning ?
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          Select an active church to view church-scoped analytics.
        </div>
      : null}

      {analytics.adminSdkUnavailable && !showScopeWarning ?
        <div
          role="alert"
          className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-900 dark:text-amber-100"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="space-y-1">
            <p className="font-medium">Limited analytics mode</p>
            <p className="text-amber-800/90 dark:text-amber-200/90">
              Firebase Admin SDK is not configured on this server, so engagement
              metrics (favorites, views) may be incomplete locally. Add{" "}
              <code className="rounded bg-amber-500/10 px-1 py-0.5 text-xs">
                FIREBASE_SERVICE_ACCOUNT_PATH
              </code>{" "}
              or{" "}
              <code className="rounded bg-amber-500/10 px-1 py-0.5 text-xs">
                FIREBASE_SERVICE_ACCOUNT_KEY
              </code>{" "}
              to your <code className="rounded bg-amber-500/10 px-1 py-0.5 text-xs">.env</code>{" "}
              file (see <code className="rounded bg-amber-500/10 px-1 py-0.5 text-xs">.env.example</code>
              ). User counts and content totals still load from Firestore.
            </p>
          </div>
        </div>
      : null}

      {(analytics.loading || analytics.insightsLoading) && !showScopeWarning ?
        <AnalyticsLoadingBanner />
      : null}

      <AnalyticsStatCards stats={statCards} loading={analytics.loading} />

      <div className="grid gap-4 lg:grid-cols-3">
        <AnalyticsInsightCard
          title="Most Favorited Song"
          description="Based on member favorites"
          itemTitle={analytics.topFavoritedSong?.title}
          metricLabel="Favorites"
          metricValue={analytics.topFavoritedSong?.count}
          loading={analytics.insightsLoading}
          emptyLabel="No song favorites yet"
          icon={Star}
        />
        <AnalyticsInsightCard
          title="Most Viewed Sermon"
          description="Recently viewed, then favorites"
          itemTitle={analytics.topViewedSermon?.title}
          metricLabel="Views"
          metricValue={analytics.topViewedSermon?.count}
          loading={analytics.insightsLoading}
          emptyLabel="No sermon engagement yet"
          icon={Mic2}
        />
        <AnalyticsInsightCard
          title="Most Read Article"
          description="Recently viewed, then favorites"
          itemTitle={analytics.topReadArticle?.title}
          metricLabel="Reads"
          metricValue={analytics.topReadArticle?.count}
          loading={analytics.insightsLoading}
          emptyLabel="No article engagement yet"
          icon={BookOpen}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AnalyticsDonationsChart
          data={analytics.monthlyDonations}
          loading={analytics.loading}
        />
        <AnalyticsContentGrowthChart
          data={analytics.contentGrowth}
          loading={analytics.loading}
        />
      </div>

      <AnalyticsRecentLists
        recentUsers={analytics.recentUsers}
        recentDonations={analytics.recentDonations}
        loading={analytics.loading}
        insightsLoading={analytics.insightsLoading}
      />
    </div>
  );
}
