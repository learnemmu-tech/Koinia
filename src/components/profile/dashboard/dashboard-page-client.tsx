"use client";

import Link from "next/link";
import { ArrowLeft, LayoutDashboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardDonationsSection } from "@/components/profile/dashboard/dashboard-donations-section";
import { DashboardPrayerRequestsSection } from "@/components/profile/dashboard/dashboard-prayer-requests-section";
import { DashboardRecentlyViewedSection } from "@/components/profile/dashboard/dashboard-recently-viewed-section";
import { DashboardStatsCards } from "@/components/profile/dashboard/dashboard-stats-cards";
import { DashboardUpcomingEventsSection } from "@/components/profile/dashboard/dashboard-upcoming-events-section";
import { DashboardWelcomeSection } from "@/components/profile/dashboard/dashboard-welcome-section";
import { pageContentClass, typePageTitleClass } from "@/lib/responsive-classes";
import type { FirebaseEvent } from "@/types/firebase-event";

type DashboardPageClientProps = {
  initialEvents?: FirebaseEvent[];
};

export function DashboardPageClient({
  initialEvents = [],
}: DashboardPageClientProps) {
  return (
    <div className={pageContentClass}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2 text-primary/70">
            <LayoutDashboard className="size-4 shrink-0" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em]">
              Dashboard
            </p>
          </div>
          <h1 className={typePageTitleClass}>My Dashboard</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            A personalized overview of your favorites, activity, events, prayer
            requests, and giving history.
          </p>
        </div>

        <Button asChild variant="outline" className="w-full shrink-0 rounded-full sm:w-auto">
          <Link href="/profile">
            <ArrowLeft className="mr-2 size-4" />
            Back to Profile
          </Link>
        </Button>
      </div>

      <DashboardWelcomeSection />
      <DashboardStatsCards />
      <DashboardRecentlyViewedSection />
      <DashboardUpcomingEventsSection initialEvents={initialEvents} />

      <div className="grid gap-8 xl:grid-cols-2">
        <DashboardPrayerRequestsSection />
        <DashboardDonationsSection />
      </div>
    </div>
  );
}
