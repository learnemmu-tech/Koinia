"use client";

import Link from "next/link";
import { ArrowRight, Clock3, MapPin } from "lucide-react";

import type { FirebaseEvent } from "@/types/firebase-event";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { DEFAULT_SONG_COVER } from "@/config/site";
import { getEventDateStartMs } from "@/lib/event-firestore";
import { cn, getSongCoverUrl } from "@/lib/utils";

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
};

export function HomeEventCard({ event }: HomeEventCardProps) {
  const href = `/events/${encodeURIComponent(event.id)}`;
  const { month, day } = eventDayParts(event.eventDate);
  const hasBanner = Boolean(event.bannerImage?.trim());
  const coverUrl = getSongCoverUrl(event.bannerImage);
  const description = event.description?.trim();

  return (
    <Link
      href={href}
      className={cn(
        "app-interactive group flex h-[7.25rem] w-full min-w-0 items-center gap-3 rounded-xl border border-border/50 bg-card/40 px-3 py-2.5",
        "transition-[background-color,border-color,transform] duration-150 ease-out",
        "hover:border-border/70 hover:bg-card/60 hover-hover:hover:-translate-y-px",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      {hasBanner ?
        <div className="relative h-[5.25rem] w-[5.5rem] shrink-0 overflow-hidden rounded-lg border border-border/40 bg-muted/30 sm:h-[5.5rem] sm:w-24">
          <ImageWithFallback
            src={coverUrl}
            fallback={DEFAULT_SONG_COVER}
            fill
            sizes="96px"
            alt=""
            className="object-cover"
          />
        </div>
      : <div className="flex size-[3.75rem] shrink-0 flex-col items-center justify-center rounded-lg border border-border/40 bg-muted/50">
          {month && day ?
            <>
              <span className="text-[9px] font-semibold tracking-[0.12em] text-muted-foreground">
                {month}
              </span>
              <span className="font-heading text-lg font-semibold leading-none text-foreground">
                {day}
              </span>
            </>
          : <span className="text-[10px] text-muted-foreground">TBD</span>}
        </div>
      }

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground sm:line-clamp-1 sm:text-[15px]">
          {event.title}
        </h3>

        <div className="space-y-0.5 text-xs text-muted-foreground">
          {event.eventTime ?
            <p className="flex min-w-0 items-center gap-1.5">
              <Clock3 className="size-3 shrink-0 opacity-80" aria-hidden />
              <span className="truncate">{event.eventTime}</span>
            </p>
          : null}
          {event.location ?
            <p className="flex min-w-0 items-center gap-1.5">
              <MapPin className="size-3 shrink-0 opacity-80" aria-hidden />
              <span className="truncate">{event.location}</span>
            </p>
          : null}
        </div>

        {description ?
          <p className="hidden truncate text-[11px] leading-snug text-muted-foreground/80 md:block">
            {description}
          </p>
        : null}
      </div>

      <ArrowRight
        className="size-4 shrink-0 text-muted-foreground transition-colors duration-150 group-hover:text-foreground"
        aria-hidden
      />
    </Link>
  );
}
