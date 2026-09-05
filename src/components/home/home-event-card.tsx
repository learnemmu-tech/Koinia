"use client";

import Link from "next/link";

import type { FirebaseEvent } from "@/types/firebase-event";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { Badge } from "@/components/ui/badge";
import { formatEventDate, getEventDateStartMs } from "@/lib/event-firestore";
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
  className?: string;
};

export function HomeEventCard({ event, className }: HomeEventCardProps) {
  const href = `/events/${encodeURIComponent(event.id)}`;
  const hasBanner = Boolean(event.bannerImage?.trim());
  const coverUrl = getSongCoverUrl(event.bannerImage);
  const { month, day } = eventDayParts(event.eventDate);
  const dateLabel = formatEventDate(event.eventDate);
  const description = event.description?.trim();
  const meta = [event.eventTime, event.location].filter(Boolean).join(" · ");

  return (
    <article
      className={cn(
        "app-interactive app-interactive-lift group flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card/40 text-left",
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

        <FavoriteButton
          itemType="event"
          itemId={event.id}
          className="absolute right-3 top-3 z-10"
        />
      </div>

      <Link href={href} className="flex flex-1 flex-col gap-2 p-4 text-left">
        <h3 className="line-clamp-2 text-left text-base font-semibold leading-snug text-foreground">
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

        <div className="mt-auto flex items-center gap-2 pt-3 text-left">
          <time className="shrink-0 text-xs text-muted-foreground/80">
            {dateLabel}
          </time>
          {event.eventTime ?
            <>
              <span aria-hidden className="shrink-0 text-xs text-muted-foreground/50">
                ·
              </span>
              <span className="truncate text-xs text-muted-foreground/80">
                {event.eventTime}
              </span>
            </>
          : null}
        </div>
      </Link>
    </article>
  );
}
