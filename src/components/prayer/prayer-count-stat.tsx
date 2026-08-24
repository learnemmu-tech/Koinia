"use client";

import { Heart } from "lucide-react";

import { cn } from "@/lib/utils";

type PrayerCountStatProps = {
  count: number;
  className?: string;
  compact?: boolean;
};

export function PrayerCountStat({
  count,
  className,
  compact = false,
}: PrayerCountStatProps) {
  const label = count === 1 ? "Prayer" : "Prayers";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 font-medium text-muted-foreground",
        compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
        className
      )}
    >
      <Heart className="size-3.5 fill-primary/20 text-primary" aria-hidden />
      <span>
        {count.toLocaleString()} {label}
      </span>
    </span>
  );
}
