"use client";

import { format } from "date-fns";
import { Loader2 } from "lucide-react";

import type { FirebaseDonation } from "@/types/firebase-donation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, type RecentUserRow } from "@/lib/admin-analytics-utils";

import { AnalyticsEmptyState } from "./analytics-stat-cards";

type AnalyticsRecentListsProps = {
  recentUsers: RecentUserRow[];
  recentDonations: FirebaseDonation[];
  loading?: boolean;
  insightsLoading?: boolean;
};

function formatDate(timestamp: number): string {
  if (!timestamp) return "—";
  return format(new Date(timestamp), "MMM d, yyyy");
}

export function AnalyticsRecentLists({
  recentUsers,
  recentDonations,
  loading = false,
  insightsLoading = false,
}: AnalyticsRecentListsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="overflow-hidden rounded-2xl border-border/50 shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20" />
        <CardHeader className="p-5 pb-3">
          <CardTitle className="font-heading text-base">
            Recent User Registrations
          </CardTitle>
          <CardDescription>Newest members on the platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-5 pb-5 pt-0">
          {insightsLoading ?
            Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full rounded-xl" />
            ))
          : recentUsers.length > 0 ?
            recentUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-muted/20 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email || "No email"}
                  </p>
                </div>
                <p className="shrink-0 text-xs text-muted-foreground">
                  {formatDate(user.createdAt)}
                </p>
              </div>
            ))
          : <AnalyticsEmptyState label="No recent registrations yet" compact />}
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-2xl border-border/50 shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20" />
        <CardHeader className="p-5 pb-3">
          <CardTitle className="font-heading text-base">
            Recent Donations
          </CardTitle>
          <CardDescription>Latest completed and pending gifts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-5 pb-5 pt-0">
          {loading ?
            Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full rounded-xl" />
            ))
          : recentDonations.length > 0 ?
            recentDonations.map((donation) => (
              <div
                key={donation.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-muted/20 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {donation.isAnonymous ? "Anonymous donor" : donation.donorName}
                  </p>
                  <p className="truncate text-xs capitalize text-muted-foreground">
                    {donation.paymentStatus}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-heading text-sm font-semibold">
                    {formatCurrency(donation.amount, donation.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(donation.createdAt)}
                  </p>
                </div>
              </div>
            ))
          : <AnalyticsEmptyState label="No donations recorded yet" compact />}
        </CardContent>
      </Card>
    </div>
  );
}

export function AnalyticsLoadingBanner() {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      Syncing live analytics…
    </div>
  );
}
