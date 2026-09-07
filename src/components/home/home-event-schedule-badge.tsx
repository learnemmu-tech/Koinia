"use client";

import type { EventScheduleInfo } from "@/lib/event-schedule";
import { cn } from "@/lib/utils";

type HomeEventScheduleBadgeProps = {
  schedule: EventScheduleInfo;
  className?: string;
};

export function HomeEventScheduleBadge({
  schedule,
  className,
}: HomeEventScheduleBadgeProps) {
  if (!schedule.label) return null;

  return (
    <div
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-md bg-black px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white",
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
      <span className="truncate">{schedule.label}</span>
    </div>
  );
}
