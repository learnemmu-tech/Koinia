"use client";

import type { EventScheduleInfo } from "@/lib/event-schedule";
import { cn } from "@/lib/utils";

type HomeEventScheduleBadgeProps = {
  schedule: EventScheduleInfo;
  className?: string;
};

const toneClasses: Record<EventScheduleInfo["tone"], string> = {
  urgent: "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300",
  soon: "border-orange-500/25 bg-orange-500/10 text-orange-800 dark:text-orange-300",
  week: "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  normal: "border-border/50 bg-muted/50 text-muted-foreground",
};

export function HomeEventScheduleBadge({
  schedule,
  className,
}: HomeEventScheduleBadgeProps) {
  if (!schedule.label) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]",
        toneClasses[schedule.tone],
        className
      )}
    >
      {schedule.showPulse ?
        <span className="relative flex size-2 shrink-0" aria-hidden>
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500/40 motion-reduce:animate-none" />
          <span className="relative inline-flex size-2 rounded-full bg-red-500" />
        </span>
      : schedule.tone === "soon" ?
        <span
          className="size-2 shrink-0 rounded-full bg-orange-500"
          aria-hidden
        />
      : schedule.tone === "week" ?
        <span
          className="size-2 shrink-0 rounded-full bg-amber-500"
          aria-hidden
        />
      : null}
      <span>{schedule.label}</span>
    </div>
  );
}
