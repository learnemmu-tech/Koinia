"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import type { FirebaseEvent } from "@/types/firebase-event";

import { ImageWithFallback } from "@/components/image-with-fallback";
import { useEventScheduleNow } from "@/hooks/use-event-schedule-now";
import {
  getEventListingStatus,
  type EventListingStatusKind,
} from "@/lib/event-schedule";
import { cn } from "@/lib/utils";

type EventCardProps = {
  event: FirebaseEvent;
  className?: string;
  /** Stacked layout for dense multi-column grids (e.g. favorites). */
  compact?: boolean;
};

function statusLabel(
  kind: EventListingStatusKind,
  t: ReturnType<typeof useTranslations<"events">>
) {
  switch (kind) {
    case "live_now":
      return t("statusLiveNow");
    case "today":
      return t("statusToday");
    case "tomorrow":
      return t("statusTomorrow");
    case "upcoming":
      return t("statusUpcoming");
    case "past":
      return t("statusPast");
  }
}

export function EventStatusDateLine({
  kind,
  dateLabel,
  showLiveDot,
  className,
}: {
  kind: EventListingStatusKind;
  dateLabel: string;
  showLiveDot: boolean;
  className?: string;
}) {
  const t = useTranslations("events");
  const label = statusLabel(kind, t);

  return (
    <p
      className={cn(
        "inline-flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] font-semibold uppercase tracking-[0.08em]",
        kind === "past" ? "text-muted-foreground" : "text-primary",
        className
      )}
    >
      {showLiveDot ?
        <span
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            kind === "live_now" ? "bg-emerald-600" : "bg-primary"
          )}
          aria-hidden
        />
      : null}
      <span>{label}</span>
      {dateLabel ?
        <>
          <span aria-hidden className="text-muted-foreground/70">
            ·
          </span>
          <span className="font-medium normal-case tracking-normal text-muted-foreground">
            {dateLabel}
          </span>
        </>
      : null}
    </p>
  );
}

function ViewEventCta({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl",
        "bg-primary px-4 text-sm font-semibold text-primary-foreground",
        "transition-colors hover:bg-[hsl(var(--primary-hover))] active:bg-[hsl(var(--primary-active))]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      )}
    >
      {label}
      <ArrowRight className="size-4" aria-hidden />
    </Link>
  );
}

export function EventCard({ event, className, compact = false }: EventCardProps) {
  const t = useTranslations("events");
  const locale = useLocale();
  const now = useEventScheduleNow();
  const href = `/events/${encodeURIComponent(event.id)}`;
  const banner = event.bannerImage?.trim() ?? "";
  const hasBanner = Boolean(banner);
  const listingStatus = getEventListingStatus(event, now, locale);
  const description = event.description?.trim();
  const eventTime = event.eventTime?.trim();
  const eventType = event.eventType?.trim();
  const location = event.location?.trim() || null;

  const content = (
    <>
      <EventStatusDateLine
        kind={listingStatus.kind}
        dateLabel={listingStatus.dateLabel}
        showLiveDot={listingStatus.showLiveDot}
      />

      {eventType ?
        <span className="inline-flex h-7 w-fit max-w-full shrink-0 items-center truncate rounded-full bg-[hsl(var(--primary-subtle))] px-2.5 text-xs font-medium text-primary">
          {eventType}
        </span>
      : null}

      <div className="min-w-0 space-y-1.5">
        <h3 className="line-clamp-2 font-heading text-lg font-semibold leading-[1.2] tracking-tight text-foreground sm:text-xl">
          <Link
            href={href}
            className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {event.title}
          </Link>
        </h3>

        {description ?
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        : null}
      </div>

      {(eventTime || location) ?
        <ul className="flex flex-col gap-1.5 text-sm text-foreground/80">
          {eventTime ?
            <li className="inline-flex min-w-0 items-center gap-1.5">
              <Clock3 className="size-3.5 shrink-0 text-primary" aria-hidden />
              <span className="min-w-0 truncate">{eventTime}</span>
            </li>
          : null}
          {location ?
            <li className="inline-flex min-w-0 items-start gap-1.5">
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
              <span className="line-clamp-2 min-w-0 leading-snug [overflow-wrap:anywhere]">
                {location}
              </span>
            </li>
          : null}
        </ul>
      : null}

      <div className="mt-auto pt-1">
        <ViewEventCta href={href} label={t("viewEvent")} />
      </div>
    </>
  );

  const image = (
    <div
      className={cn(
        "relative overflow-hidden bg-muted",
        compact ?
          "aspect-video w-full shrink-0 rounded-t-[0.9rem]"
        : "aspect-[16/10] w-full shrink-0 sm:aspect-auto sm:w-[42%] sm:max-w-[16.5rem] sm:self-stretch"
      )}
    >
      <Link
        href={href}
        className="absolute inset-0 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={event.title}
      >
        {hasBanner ?
          <ImageWithFallback
            src={banner}
            fallback={banner}
            fill
            sizes={
              compact ?
                "(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
              : "(min-width: 1024px) 20vw, (min-width: 640px) 40vw, 100vw"
            }
            alt=""
            className="object-cover transition-[transform] duration-200 ease-out motion-safe:group-hover:scale-[1.015]"
          />
        : <div className="flex size-full flex-col items-center justify-center gap-2 bg-[hsl(var(--primary-subtle))]">
            <CalendarDays className="size-8 text-primary/70" aria-hidden />
          </div>
        }
      </Link>
    </div>
  );

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_1px_2px_rgba(28,43,58,0.04),0_8px_20px_-14px_rgba(28,43,58,0.14)]",
        "transition-[border-color,box-shadow] duration-150 ease-out",
        "hover:border-[hsl(var(--card-hover-border))] hover:shadow-[0_2px_4px_rgba(28,43,58,0.05),0_12px_24px_-14px_rgba(28,43,58,0.18)]",
        !compact && "sm:min-h-[14rem] sm:flex-row",
        className
      )}
    >
      {image}
      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col gap-2.5 p-4 sm:gap-3 sm:p-5",
          !compact && "sm:pl-5"
        )}
      >
        {content}
      </div>
    </article>
  );
}
