import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { isSectionVisible } from "@/lib/templates/visibility";
import { HeritageButton } from "@/templates/heritage/components/heritage-button";
import { HeritageImage } from "@/templates/heritage/components/heritage-image";
import { HeritageFrame } from "@/templates/heritage/sections/heritage-frame";
import {
  eventDateParts,
  formatLongDate,
  upcomingChurchEvents,
} from "@/templates/heritage/lib";
import { HERITAGE_FALLBACK_IMAGES } from "@/templates/heritage/theme";

/** The only place events appear on the home page. */
export function HeritageEventsSection({ model }: { model: ChurchWebsiteViewModel }) {
  if (!isSectionVisible(model.website.visibility, "events")) return null;

  const slug = model.church.slug;
  const events = upcomingChurchEvents(model.events, 4);
  if (events.length === 0) return null;
  const allEvents = churchWebsitePath(slug, "/events");

  return (
    <section
      aria-labelledby="heritage-events-heading"
      className="heritage-section border-y border-[var(--heritage-border)] bg-[var(--heritage-surface)]"
    >
      <HeritageFrame>
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div>
            <p className="heritage-eyebrow">Gather</p>
            <h2
              id="heritage-events-heading"
              className="heritage-display mt-3 text-[length:var(--heritage-section)]"
            >
              Upcoming events
            </h2>
          </div>
          <HeritageButton href={allEvents} variant="ghost">
            View all events
          </HeritageButton>
        </div>

        <ul className="mt-10 divide-y divide-[var(--heritage-border)] border-y border-[var(--heritage-border)]">
          {events.map((event) => {
            const href = churchWebsitePath(slug, `/events/${event.id}`);
            const parts = eventDateParts(event.eventDate);
            const meta = [event.eventTime, event.location].filter(Boolean).join(" · ");
            return (
              <li key={event.id}>
                <Link
                  href={href}
                  className="group grid items-center gap-x-8 gap-y-3 py-6 transition-colors hover:bg-[var(--heritage-background)] sm:grid-cols-[5.5rem_minmax(0,1fr)_auto] sm:px-4 md:grid-cols-[5.5rem_minmax(0,1fr)_9rem_auto]"
                >
                  <div className="flex items-baseline gap-3 sm:block sm:text-center">
                    {parts ? (
                      <>
                        <span className="heritage-display block text-[2.15rem] leading-none text-[var(--heritage-primary)]">
                          {parts.day}
                        </span>
                        <span className="block text-sm font-semibold tracking-[0.08em] uppercase text-[var(--heritage-accent-ink)]">
                          {parts.month}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-semibold text-[var(--heritage-accent-ink)]">
                        {formatLongDate(event.eventDate)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="heritage-display text-[1.25rem] leading-snug group-hover:text-[var(--heritage-primary)] sm:text-[1.375rem]">
                      {event.title}
                    </h3>
                    {meta || parts ? (
                      <p className="mt-1 text-[var(--heritage-muted)]">
                        {[parts?.weekday, meta].filter(Boolean).join(" · ")}
                      </p>
                    ) : null}
                  </div>
                  {event.bannerImage ? (
                    <div className="heritage-media relative hidden aspect-[16/10] w-36 rounded-[var(--heritage-radius)] md:block">
                      <HeritageImage
                        src={event.bannerImage}
                        alt=""
                        fallback={HERITAGE_FALLBACK_IMAGES.event}
                        sizes="144px"
                      />
                    </div>
                  ) : (
                    <div className="hidden w-36 md:block" aria-hidden />
                  )}
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--heritage-primary)] sm:justify-self-end">
                    Details
                    <ArrowRight
                      className="size-4 transition-transform group-hover:translate-x-1"
                      aria-hidden
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </HeritageFrame>
    </section>
  );
}
