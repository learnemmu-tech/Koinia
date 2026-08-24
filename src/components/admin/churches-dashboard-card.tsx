"use client";

import { Building2 } from "lucide-react";

import { cn } from "@/lib/utils";

type ChurchesDashboardCardProps = {
  total: number | string;
  active: number | string;
  loading?: boolean;
  activeTab?: boolean;
  onSelect: () => void;
};

export function ChurchesDashboardCard({
  total,
  active,
  loading = false,
  activeTab = false,
  onSelect,
}: ChurchesDashboardCardProps) {
  const stats = [
    { label: "Total Churches", value: loading ? "—" : total },
    { label: "Active Churches", value: loading ? "—" : active },
  ];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group w-full overflow-hidden rounded-2xl border border-border/50 bg-card text-left shadow-sm transition-colors",
        activeTab ? "border-primary/40 ring-1 ring-primary/20" : "hover:border-border"
      )}
    >
      <div className="h-1 w-full bg-gradient-to-r from-primary/30 via-primary to-primary/30" />
      <div className="space-y-4 p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/60">
              Platform
            </p>
            <h3 className="font-heading text-base font-bold">Church Management</h3>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border/40 bg-muted/20 px-3 py-2.5"
            >
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              <p className="font-heading text-lg font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </button>
  );
}
