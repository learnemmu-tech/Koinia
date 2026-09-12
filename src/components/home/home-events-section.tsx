"use client";

import type { FirebaseEvent } from "@/types/firebase-event";

import { getHomeDisplayEvents } from "@/lib/event-schedule";
import { useEventScheduleNow } from "@/hooks/use-event-schedule-now";

import { HomeEmptyState } from "./home-empty-state";
import { HomeEventCard } from "./home-event-card";
import { HomeSectionHeader } from "./home-section-header";

type HomeEventsSectionProps = {
  events: FirebaseEvent[];
};

export function HomeEventsSection({ events }: HomeEventsSectionProps) {
  const now = useEventScheduleNow();
  const { visible } = getHomeDisplayEvents(events, now, 4);

  return (
    <section aria-labelledby="home-events-heading" className="space-y-4">
      <HomeSectionHeader
        id="home-events-heading"
        title="Upcoming Events"
        description="Gather with the community for worship, teaching, and fellowship."
        href="/events"
        viewAllLabel="View All Events"
        viewAllClassName="text-primary hover:text-primary-hover"
      />
      {visible.length === 0 ?
        <HomeEmptyState
          title="No upcoming events"
          description="Check back soon for new gatherings."
        />
      : <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {visible.map((event) => (
            <HomeEventCard key={event.id} event={event} />
          ))}
        </div>
      }
    </section>
  );
}
