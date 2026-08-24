"use client";

import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type AnalyticsStatDefinition = {
  key: string;
  label: string;
  value: number;
  icon: LucideIcon;
};

type AnalyticsStatCardsProps = {
  stats: AnalyticsStatDefinition[];
  loading?: boolean;
};

export function AnalyticsStatCards({
  stats,
  loading = false,
}: AnalyticsStatCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 sm:gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <Card
            key={stat.key}
            className="overflow-hidden rounded-2xl border-border/50 shadow-sm"
          >
            <div className="h-1 w-full bg-gradient-to-r from-primary/30 via-primary/60 to-primary/30" />
            <CardHeader className="space-y-3 p-4 pb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <CardTitle className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {loading ?
                <Skeleton className="h-8 w-16" />
              : <p className="font-heading text-2xl font-bold sm:text-3xl">
                  {stat.value.toLocaleString()}
                </p>
              }
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

type AnalyticsInsightCardProps = {
  title: string;
  description: string;
  itemTitle?: string | null;
  metricLabel?: string;
  metricValue?: number | null;
  loading?: boolean;
  emptyLabel?: string;
  icon: LucideIcon;
};

export function AnalyticsInsightCard({
  title,
  description,
  itemTitle,
  metricLabel = "Engagement",
  metricValue,
  loading = false,
  emptyLabel = "No data yet",
  icon: Icon,
}: AnalyticsInsightCardProps) {
  const hasData = Boolean(itemTitle);

  return (
    <Card className="overflow-hidden rounded-2xl border-border/50 shadow-sm">
      <div className="h-1 w-full bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20" />
      <CardHeader className="space-y-2 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="font-heading text-base">{title}</CardTitle>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0">
        {loading ?
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        : hasData ?
          <div className="space-y-1">
            <p className="font-heading text-lg font-semibold leading-snug">
              {itemTitle}
            </p>
            <p className="text-sm text-muted-foreground">
              {metricLabel}:{" "}
              <span className="font-medium text-foreground">
                {metricValue?.toLocaleString() ?? 0}
              </span>
            </p>
          </div>
        : <AnalyticsEmptyState label={emptyLabel} compact />}
      </CardContent>
    </Card>
  );
}

type AnalyticsEmptyStateProps = {
  label: string;
  compact?: boolean;
};

export function AnalyticsEmptyState({
  label,
  compact = false,
}: AnalyticsEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/20 text-center text-sm text-muted-foreground",
        compact ? "px-4 py-6" : "px-6 py-10"
      )}
    >
      {label}
    </div>
  );
}
