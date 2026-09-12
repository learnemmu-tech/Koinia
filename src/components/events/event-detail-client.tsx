"use client";

import type { ReactNode } from "react";
import {
  BookOpen,
  CalendarDays,
  Clock3,
  Info,
  MapPin,
  Tag,
  UserRound,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import type { FirebaseEvent } from "@/types/firebase-event";

import { BackButton } from "@/components/back-button";
import { ContentAreaLoading } from "@/components/content-area-loading";
import { AddToCalendarButton } from "@/components/events/add-to-calendar-button";
import { EventStatusDateLine } from "@/components/events/event-card";
import { RegisterForEventButton } from "@/components/events/register-for-event-button";
import { ShareEventButton } from "@/components/events/share-event-button";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { useEventDetailQuery } from "@/hooks/use-event-detail-query";
import { useEventScheduleNow } from "@/hooks/use-event-schedule-now";
import {
  formatCompactEventDate,
  getEventListingStatus,
} from "@/lib/event-schedule";
import { cn } from "@/lib/utils";

type EventDetailClientProps = {
  eventId: string;
  initialEvent: FirebaseEvent;
};

const HERO_DESCRIPTION_CHARS = 200;

function excerpt(text: string, maxChars: number) {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, maxChars).trimEnd()}…`;
}

export function EventDetailClient({
  eventId,
  initialEvent,
}: EventDetailClientProps) {
  const t = useTranslations("events");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const now = useEventScheduleNow();
  const { data: event, isLoading } = useEventDetailQuery(eventId, initialEvent);

  if (isLoading && !event) {
    return <ContentAreaLoading />;
  }

  if (!event || event.status !== "published") {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-border/60 px-6 py-16 text-center">
        <p className="font-heading text-xl font-semibold text-foreground">
          {t("notFoundTitle")}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("notFoundDescription")}
        </p>
        <BackButton
          label={t("backToEvents")}
          fallbackHref="/events"
          className="mt-5"
        />
      </div>
    );
  }

  const banner = event.bannerImage?.trim() ?? "";
  const hasBanner = Boolean(banner);
  const listingStatus = getEventListingStatus(event, now, locale);
  const description = event.description?.trim() ?? "";
  const heroDescription =
    description ? excerpt(description, HERO_DESCRIPTION_CHARS) : "";
  const location = event.location?.trim() ?? "";
  const eventTime = event.eventTime?.trim() ?? "";
  const eventType = event.eventType?.trim() ?? "";
  const speakerName = event.speakerName?.trim() ?? "";
  const compactDate =
    listingStatus.dateLabel || formatCompactEventDate(event.eventDate, locale);

  const actionBtn =
    "h-11 w-full rounded-xl px-5 text-sm font-semibold sm:w-auto sm:min-w-[10rem]";

  return (
    <article className="mx-auto w-full min-w-0 max-w-6xl pb-8 pt-1">
      <div className="mb-8 flex items-center justify-between gap-3">
        <BackButton label={t("backToEvents")} fallbackHref="/events" />
        <ShareEventButton
          eventId={event.id}
          title={event.title}
          description={description.slice(0, 160) || undefined}
          className="h-9 rounded-xl border-border/70 bg-card px-4 text-sm font-medium"
          label={tCommon("share")}
        />
      </div>

      {/* Hero: ~45% image / ~55% content — compact height */}
      <section className="grid items-start gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-7">
        <div className="relative aspect-video w-full overflow-hidden rounded-[15px] bg-muted shadow-sm sm:max-h-[280px] lg:max-h-[380px]">
          {hasBanner ?
            <ImageWithFallback
              src={banner}
              fallback={banner}
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              alt={event.title}
              className="object-cover"
              priority
            />
          : <div className="flex size-full min-h-[11rem] flex-col items-center justify-center gap-2 bg-[hsl(var(--primary-subtle))] sm:min-h-[13rem]">
              <CalendarDays className="size-9 text-primary/75" aria-hidden />
              <span className="text-sm font-medium text-primary/80">
                {t("title")}
              </span>
            </div>
          }
        </div>

        <div className="flex min-w-0 flex-col items-start gap-0 lg:pt-0.5">
          <EventStatusDateLine
            kind={listingStatus.kind}
            dateLabel={listingStatus.dateLabel}
            showLiveDot={listingStatus.showLiveDot}
          />

          {eventType ?
            <span className="mt-3.5 inline-flex h-7 w-fit max-w-full shrink-0 items-center truncate rounded-full bg-[hsl(var(--primary-subtle))] px-2.5 text-xs font-semibold text-primary">
              {eventType}
            </span>
          : null}

          <h1
            className={cn(
              "font-heading font-semibold tracking-tight text-foreground",
              "mt-4 text-[1.875rem] leading-[1.1] sm:text-[2.125rem] lg:text-[2.625rem]"
            )}
          >
            {event.title}
          </h1>

          {heroDescription ?
            <p className="mt-4 line-clamp-3 max-w-xl text-[0.9375rem] leading-relaxed text-muted-foreground sm:text-base">
              {heroDescription}
            </p>
          : null}

          <div className="mt-4 flex w-full flex-col gap-2 text-sm text-foreground/90">
            {eventTime ?
              <p className="inline-flex min-w-0 items-center gap-2">
                <Clock3
                  className="size-[1.125rem] shrink-0 text-primary/85"
                  aria-hidden
                />
                <span className="min-w-0 font-medium">{eventTime}</span>
              </p>
            : null}
            {location ?
              <p className="inline-flex min-w-0 items-start gap-2">
                <MapPin
                  className="mt-0.5 size-[1.125rem] shrink-0 text-primary/85"
                  aria-hidden
                />
                <span className="min-w-0 font-medium leading-snug [overflow-wrap:anywhere]">
                  {location}
                </span>
              </p>
            : null}
          </div>

          <div className="mt-5 flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <RegisterForEventButton
              eventId={event.id}
              eventTitle={event.title}
              className={cn(
                actionBtn,
                "border-transparent bg-primary text-primary-foreground hover:bg-[hsl(var(--primary-hover))]"
              )}
              priority
            />
            <AddToCalendarButton
              event={event}
              className={cn(
                actionBtn,
                "border border-border/70 bg-card text-foreground hover:bg-muted/40"
              )}
              label={t("saveToCalendar")}
              variant="outline"
            />
          </div>
        </div>
      </section>

      {/* About (~65%) + sidebar (~35%) */}
      <section className="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:gap-5">
        <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="size-4 text-primary/90" aria-hidden />
            <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
              {t("aboutThisEvent")}
            </h2>
          </div>
          {description ?
            <p className="max-w-prose whitespace-pre-wrap text-[0.9375rem] leading-[1.65] text-foreground/90 sm:text-base">
              {description}
            </p>
          : <p className="text-sm text-muted-foreground">{t("noDescription")}</p>}
        </section>

        <div className="space-y-3.5">
          {speakerName ?
            <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:px-6 sm:py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {t("organizedBy")}
              </p>
              <div className="mt-2.5 flex items-start gap-2.5">
                <UserRound
                  className="mt-0.5 size-[1.125rem] shrink-0 text-primary/85"
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{speakerName}</p>
                  {location ?
                    <p className="mt-0.5 text-sm leading-snug text-muted-foreground [overflow-wrap:anywhere]">
                      {location}
                    </p>
                  : null}
                </div>
              </div>
            </section>
          : null}

          <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:px-6 sm:py-5">
            <div className="mb-3.5 flex items-center gap-2">
              <Info className="size-4 text-primary/90" aria-hidden />
              <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
                {t("eventDetails")}
              </h2>
            </div>
            <dl className="space-y-3.5">
              {compactDate ?
                <DetailRow
                  icon={<CalendarDays className="size-[1.125rem]" aria-hidden />}
                  label={t("detailDate")}
                  value={compactDate}
                />
              : null}
              {eventTime ?
                <DetailRow
                  icon={<Clock3 className="size-[1.125rem]" aria-hidden />}
                  label={t("detailTime")}
                  value={eventTime}
                />
              : null}
              {location ?
                <DetailRow
                  icon={<MapPin className="size-[1.125rem]" aria-hidden />}
                  label={t("detailLocation")}
                  value={location}
                />
              : null}
              {eventType ?
                <DetailRow
                  icon={<Tag className="size-[1.125rem]" aria-hidden />}
                  label={t("detailType")}
                  value={eventType}
                />
              : null}
              {speakerName ?
                <DetailRow
                  icon={<UserRound className="size-[1.125rem]" aria-hidden />}
                  label={t("detailSpeaker")}
                  value={speakerName}
                />
              : null}
            </dl>
          </section>
        </div>
      </section>
    </article>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[1.25rem_5.5rem_minmax(0,1fr)] items-start gap-x-2.5">
      <span className="mt-0.5 flex text-primary/85" aria-hidden>
        {icon}
      </span>
      <dt className="text-[0.875rem] leading-snug text-muted-foreground">
        {label}
      </dt>
      <dd className="text-[0.9375rem] font-medium leading-snug text-foreground [overflow-wrap:anywhere]">
        {value}
      </dd>
    </div>
  );
}
