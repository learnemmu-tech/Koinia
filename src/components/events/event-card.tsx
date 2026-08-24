"use client";

import Link from "next/link";
import { CalendarDays, Clock3, MapPin } from "lucide-react";

import type { FirebaseEvent } from "@/types/firebase-event";

import { ImageWithFallback } from "@/components/image-with-fallback";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_SONG_COVER } from "@/config/site";
import { formatEventDate } from "@/lib/event-firestore";
import { cn, getSongCoverUrl } from "@/lib/utils";

type EventCardProps = {
  event: FirebaseEvent;
  className?: string;
};

export function EventCard({ event, className }: EventCardProps) {
  const href = `/events/${encodeURIComponent(event.id)}`;
  const coverUrl = getSongCoverUrl(event.bannerImage);

  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card/40 transition-colors duration-200 hover:border-border/80 hover:bg-card/60",
        className
      )}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted/30">
        <ImageWithFallback
          src={coverUrl}
          fallback={DEFAULT_SONG_COVER}
          fill
          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
          alt={event.title}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute left-3 top-3 z-20 flex items-start gap-2">
          <Badge className="rounded-md border-0 bg-background/85 px-2 py-0.5 text-[10px] font-medium text-foreground shadow-sm backdrop-blur-sm">
            {event.eventType}
          </Badge>
        </div>
        <FavoriteButton
          itemType="event"
          itemId={event.id}
          className="absolute right-3 top-3 z-20"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-2 font-heading text-base font-semibold leading-snug text-foreground">
          {event.title}
        </h3>

        <ul className="mt-auto flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:items-start sm:gap-x-5 sm:gap-y-2">
          <li className="flex min-w-0 items-start gap-1.5">
            <CalendarDays
              className="mt-0.5 size-3.5 shrink-0"
              aria-hidden
            />
            <span className="min-w-0 break-words">
              {formatEventDate(event.eventDate)}
            </span>
          </li>
          {event.eventTime ?
            <li className="flex min-w-0 items-start gap-1.5">
              <Clock3 className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span className="min-w-0 break-words">{event.eventTime}</span>
            </li>
          : null}
          {event.location ?
            <li className="flex min-w-0 items-start gap-1.5 sm:min-w-[8rem] sm:flex-1 sm:basis-40">
              <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span className="min-w-0 break-words">{event.location}</span>
            </li>
          : null}
        </ul>
      </div>
    </Link>
  );
}
