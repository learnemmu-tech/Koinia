"use client";

import Link from "next/link";

import type { FirebaseEvent } from "@/types/firebase-event";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { Badge } from "@/components/ui/badge";
import { formatEventDate, getEventDateStartMs } from "@/lib/event-firestore";
import {
  getEventScheduleInfo,
  type EventScheduleInfo,
} from "@/lib/event-schedule";
import { cn, getSongCoverUrl } from "@/lib/utils";

import { HomeEventScheduleBadge } from "./home-event-schedule-badge";

function eventDayParts(eventDate: string) {
  const start = getEventDateStartMs(eventDate);
  if (start == null) {
    return { month: "", day: "" };
  }

  const date = new Date(start);
  return {
    month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    day: String(date.getDate()),
  };
}

type HomeEventCardProps = {
  event: FirebaseEvent;
  className?: string;
  highlight?: boolean;
  schedule?: EventScheduleInfo;
  now?: number;
};

export function HomeEventCard({
  event,
  className,
  highlight = false,
  schedule,
  now = Date.now(),
}: HomeEventCardProps) {
  const href = `/events/${encodeURIComponent(event.id)}`;
  const hasBanner = Boolean(event.bannerImage?.trim());
  const coverUrl = getSongCoverUrl(event.bannerImage);
  const { month, day } = eventDayParts(event.eventDate);
  const dateLabel = formatEventDate(event.eventDate);
  const description = event.description?.trim();
  const meta = [event.eventTime, event.location].filter(Boolean).join(" · ");
  const scheduleInfo = schedule ?? getEventScheduleInfo(event, now);
  const showSchedule = highlight && scheduleInfo.label;

  return (
    <article
      className={cn(
        "app-interactive app-interactive-lift app-mobile-card group flex flex-col overflow-hidden rounded-xl border bg-card/40 text-left",
        highlight
          ? "border-primary/35 shadow-sm shadow-primary/5 ring-1 ring-primary/10"
          : "border-border/50",
        className
      )}
    >
      <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-muted">
        <Link href={href} className="block size-full">
          {hasBanner ?
            <ImageWithFallback
              src={coverUrl}
              fallback={coverUrl}
              fill
              sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              alt={event.title}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          : <div className="flex size-full flex-col items-center justify-center bg-muted/50 text-center">
              {month && day ?
                <>
                  <span className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground">
                    {month}
                  </span>
                  <span className="font-heading text-3xl font-semibold leading-none text-foreground">
                    {day}
                  </span>
                </>
              : <span className="text-sm text-muted-foreground">Date TBD</span>}
            </div>
          }
        </Link>

        {event.eventType ?
          <Badge
            variant="secondary"
            className="pointer-events-none absolute left-3 top-3 rounded-md border-0 bg-background/85 px-2 py-0.5 text-[10px] font-medium text-foreground shadow-sm backdrop-blur-sm"
          >
            {event.eventType}
          </Badge>
        : null}

        {showSchedule ?
          <HomeEventScheduleBadge
            schedule={scheduleInfo}
            className="pointer-events-none absolute right-3 top-3 z-10 max-w-[calc(100%-5.5rem)] whitespace-nowrap shadow-sm backdrop-blur-sm"
          />
        : null}
      </div>

      <Link href={href} className="flex flex-1 flex-col gap-2 p-4 text-left">
        <h3
          className={cn(
            "line-clamp-2 text-left font-semibold leading-snug text-foreground",
            highlight ? "text-base sm:text-[1.05rem]" : "text-base"
          )}
        >
          {event.title}
        </h3>

        {description ?
          <p className="line-clamp-2 text-left text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        : meta ?
          <p className="line-clamp-2 text-left text-sm leading-relaxed text-muted-foreground">
            {meta}
          </p>
        : null}

        <div className="mt-auto space-y-2 pt-3 text-left">
          <div className="flex items-center gap-2">
            <time className="shrink-0 text-xs text-muted-foreground/80">
              {dateLabel}
            </time>
            {event.eventTime ?
              <>
                <span
                  aria-hidden
                  className="shrink-0 text-xs text-muted-foreground/50"
                >
                  ·
                </span>
                <span className="truncate text-xs text-muted-foreground/80">
                  {event.eventTime}
                </span>
              </>
            : null}
          </div>

          {highlight && scheduleInfo.countdownLabel ?
            <p className="text-xs font-medium text-foreground/80">
              {scheduleInfo.countdownLabel}
            </p>
          : null}

          {highlight ?
            <span className="inline-flex text-xs font-semibold text-primary">
              View Event
            </span>
          : null}
        </div>
      </Link>
    </article>
  );
}
