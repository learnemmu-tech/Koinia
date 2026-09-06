"use client";

import type { FirebaseEvent } from "@/types/firebase-event";

import { getEventScheduleInfo, getHomeDisplayEvents } from "@/lib/event-schedule";
import { useEventScheduleNow } from "@/hooks/use-event-schedule-now";

import { HomeCollectionRail, homeRailItemClass, HOME_RAIL_LANDSCAPE } from "./home-collection-rail";
import { HomeEmptyState } from "./home-empty-state";
import { HomeEventCard } from "./home-event-card";
import { HomeSectionHeader } from "./home-section-header";

type HomeEventsSectionProps = {
  events: FirebaseEvent[];
};

export function HomeEventsSection({ events }: HomeEventsSectionProps) {
  const now = useEventScheduleNow();
  const { highlight, rest, visible } = getHomeDisplayEvents(events, now, 3);

  return (
    <section aria-labelledby="home-events-heading" className="space-y-3">
      <HomeSectionHeader
        id="home-events-heading"
        title="Upcoming Events"
        description="Gather with the community for worship, teaching, and fellowship."
        href="/events"
      />
      {visible.length === 0 ?
        <HomeEmptyState
          title="No upcoming events"
          description="Check back soon for new gatherings."
        />
      : <HomeCollectionRail className="md:mx-0 md:grid md:max-w-4xl md:grid-cols-3 md:overflow-visible md:px-0">
          {highlight ?
            <div className={homeRailItemClass(HOME_RAIL_LANDSCAPE)}>
              <HomeEventCard
                event={highlight}
                highlight
                schedule={getEventScheduleInfo(highlight, now)}
                now={now}
              />
            </div>
          : null}
          {rest.map((event) => (
            <div
              key={event.id}
              className={homeRailItemClass(HOME_RAIL_LANDSCAPE)}
            >
              <HomeEventCard event={event} now={now} />
            </div>
          ))}
        </HomeCollectionRail>
      }
    </section>
  );
}
