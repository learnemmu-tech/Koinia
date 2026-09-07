"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, MapPin, UserRound } from "lucide-react";

import type { FirebaseEvent } from "@/types/firebase-event";
import { ImageWithFallback } from "@/components/image-with-fallback";
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
  const location = event.location?.trim();
  const speaker = event.speakerName?.trim();
  const eventTime = event.eventTime?.trim();
  const scheduleInfo = schedule ?? getEventScheduleInfo(event, now);

  return (
    <article
      className={cn(
        "app-interactive app-interactive-lift app-mobile-card group flex h-full flex-col overflow-hidden rounded-xl border bg-card/40 text-left",
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
          <span className="pointer-events-none absolute left-3 top-3 z-10 max-w-[calc(50%-0.75rem)] truncate rounded-md bg-black px-2 py-1 text-[10px] font-medium text-white">
            {event.eventType}
          </span>
        : null}

        {scheduleInfo.label ?
          <HomeEventScheduleBadge
            schedule={scheduleInfo}
            className="pointer-events-none absolute right-3 top-3 z-10 max-w-[calc(50%-0.75rem)]"
          />
        : null}
      </div>

      <Link href={href} className="flex min-w-0 flex-1 flex-col p-4 text-left">
        <h3
          className={cn(
            "line-clamp-2 font-semibold leading-snug text-foreground",
            highlight ? "text-base sm:text-[1.05rem]" : "text-base"
          )}
        >
          {event.title}
        </h3>

        {description ?
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        : null}

        <div className="mt-auto min-w-0 space-y-3 pt-3">
          <div className="grid min-w-0 gap-1.5 text-xs text-muted-foreground">
            <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-start sm:gap-x-4">
              <span className="inline-flex min-w-0 items-start gap-1.5">
                <CalendarDays className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <time className="min-w-0 break-words leading-snug">{dateLabel}</time>
              </span>
              {eventTime ?
                <span className="inline-flex min-w-0 items-start gap-1.5">
                  <Clock3 className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span className="min-w-0 break-words leading-snug">
                    {eventTime}
                  </span>
                </span>
              : null}
            </div>
            {location ?
              <span className="inline-flex min-w-0 items-start gap-1.5">
                <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span className="min-w-0 break-words leading-snug [overflow-wrap:anywhere]">
                  {location}
                </span>
              </span>
            : null}
            {speaker ?
              <span className="inline-flex min-w-0 items-start gap-1.5">
                <UserRound className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span className="min-w-0 break-words leading-snug">
                  {speaker}
                </span>
              </span>
            : null}
          </div>

          <span className="inline-flex min-h-8 items-center gap-1 text-xs font-semibold text-primary">
            View Event
            <ArrowRight className="size-3.5" aria-hidden />
          </span>
        </div>
      </Link>
    </article>
  );
}
