"use client";

import Link from "next/link";
import { Clock3, MapPin } from "lucide-react";

import type { FirebaseEvent } from "@/types/firebase-event";

import { FavoriteButton } from "@/components/favorites/favorite-button";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { DEFAULT_SONG_COVER } from "@/config/site";
import { formatEventDate, getEventDateStartMs } from "@/lib/event-firestore";
import { getSongCoverUrl } from "@/lib/utils";

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
  const coverUrl = getSongCoverUrl(event.bannerImage);
  const { month, day } = eventDayParts(event.eventDate);

  return (
    <Link
      href={href}
      className="app-interactive app-interactive-lift group flex h-full min-w-0 w-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-muted">
        <ImageWithFallback
          src={coverUrl}
          fallback={DEFAULT_SONG_COVER}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 16.5rem"
          alt={event.title}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {month && day ?
          <div className="absolute left-3 top-3 z-10 flex min-w-10 flex-col items-center rounded-md bg-background/85 px-1.5 py-1 backdrop-blur-sm">
            <span className="text-[9px] font-semibold tracking-[0.12em] text-muted-foreground">
              {month}
            </span>
            <span className="font-heading text-sm font-semibold leading-none text-foreground">
              {day}
            </span>
          </div>
        : null}
        <FavoriteButton
          itemType="event"
          itemId={event.id}
          className="absolute right-3 top-3 z-10"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-left text-base font-semibold leading-snug text-foreground">
          {event.title}
        </h3>
        <time dateTime={event.eventDate} className="sr-only">
          {formatEventDate(event.eventDate)}
        </time>
        <div className="mt-auto flex min-w-0 flex-col gap-1.5 text-xs text-muted-foreground">
          {event.eventTime ?
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Clock3 className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{event.eventTime}</span>
            </span>
          : null}
          {event.location ?
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{event.location}</span>
            </span>
          : null}
        </div>
      </div>
    </Link>
  );
}
