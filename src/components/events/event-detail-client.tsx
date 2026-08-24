"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Loader2,
  MapPin,
  UserRound,
} from "lucide-react";

import type { FirebaseEvent } from "@/types/firebase-event";

import { AddToCalendarButton } from "@/components/events/add-to-calendar-button";
import { RegisterForEventButton } from "@/components/events/register-for-event-button";
import { ShareEventButton } from "@/components/events/share-event-button";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_SONG_COVER } from "@/config/site";
import { useEventDetailQuery } from "@/hooks/use-event-detail-query";
import {
  formatEventDate,
  formatEventDateTime,
} from "@/lib/event-firestore";
import { getSongCoverUrl } from "@/lib/utils";
import { pageDetailClass, typePageTitleClass } from "@/lib/responsive-classes";

type EventDetailClientProps = {
  eventId: string;
  initialEvent: FirebaseEvent;
};

export function EventDetailClient({
  eventId,
  initialEvent,
}: EventDetailClientProps) {
  const { data: event, isLoading } = useEventDetailQuery(eventId, initialEvent);

  if (isLoading && !event) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!event || event.status !== "published") {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          This event is not available.
        </p>
        <Link
          href="/events"
          className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
        >
          Back to Events
        </Link>
      </div>
    );
  }

  const coverUrl = getSongCoverUrl(event.bannerImage);

  return (
    <article className={`${pageDetailClass} space-y-6 pt-2`}>
      <Link
        href="/events"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to Events
      </Link>

      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="relative aspect-[21/9] w-full bg-muted/30">
          <ImageWithFallback
            src={coverUrl}
            fallback={DEFAULT_SONG_COVER}
            fill
            sizes="(min-width: 1024px) 896px, 100vw"
            alt={event.title}
            className="object-cover"
            priority
          />
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <Badge className="rounded-md bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/10">
                {event.eventType}
              </Badge>
              <h1 className={typePageTitleClass}>
                {event.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {formatEventDateTime(event)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <RegisterForEventButton
                eventId={event.id}
                eventTitle={event.title}
              />
              <ShareEventButton
                eventId={event.id}
                title={event.title}
                description={event.description.slice(0, 160)}
              />
              <AddToCalendarButton event={event} />
            </div>
          </div>

          <div className="grid gap-3 rounded-xl border border-border/40 bg-muted/20 p-4 sm:grid-cols-3">
            <MetaItem
              icon={<CalendarDays className="size-4" />}
              label="Date"
              value={formatEventDate(event.eventDate)}
            />
            {event.eventTime ?
              <MetaItem
                icon={<Clock3 className="size-4" />}
                label="Time"
                value={event.eventTime}
              />
            : null}
            {event.location ?
              <MetaItem
                icon={<MapPin className="size-4" />}
                label="Location"
                value={event.location}
              />
            : null}
            {event.speakerName ?
              <MetaItem
                icon={<UserRound className="size-4" />}
                label="Speaker"
                value={event.speakerName}
              />
            : null}
          </div>

          <div className="border-t border-border/40 pt-6">
            <h2 className="mb-3 font-heading text-base font-semibold sm:text-lg">
              About This Event
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 sm:text-base">
              {event.description}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function MetaItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1">
      <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="min-w-0 break-words text-sm font-medium text-foreground">
        {value}
      </p>
    </div>
  );
}
