"use client";

import { HeartHandshake } from "lucide-react";

import { cn } from "@/lib/utils";

type PrayerRequestsDashboardCardProps = {
  total: number | string;
  pending: number | string;
  approved: number | string;
  loading?: boolean;
  active?: boolean;
  onSelect: () => void;
};

export function PrayerRequestsDashboardCard({
  total,
  pending,
  approved,
  loading = false,
  active = false,
  onSelect,
}: PrayerRequestsDashboardCardProps) {
  const stats = [
    { label: "Total Requests", value: loading ? "—" : total },
    { label: "Pending Requests", value: loading ? "—" : pending },
    { label: "Approved Requests", value: loading ? "—" : approved },
  ];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-border/50 bg-card text-left shadow-sm transition-colors hover:border-primary/30",
        active && "border-primary/40 ring-1 ring-primary/20"
      )}
    >
      <div className="h-1 w-full bg-gradient-to-r from-primary/30 via-primary/60 to-primary/30" />
      <div className="space-y-4 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <HeartHandshake className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/60">
              Dashboard
            </p>
            <h2 className="font-heading text-lg font-semibold">Prayer Requests</h2>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border/40 bg-muted/20 px-3 py-3"
            >
              <p className="font-heading text-lg font-bold sm:text-xl">
                {stat.value}
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </button>
  );
}
