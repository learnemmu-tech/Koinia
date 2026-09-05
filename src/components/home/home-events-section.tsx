import type { FirebaseEvent } from "@/types/firebase-event";

import { HomeEmptyState } from "./home-empty-state";
import { HomeEventCard } from "./home-event-card";
import { HomeSectionHeader } from "./home-section-header";

type HomeEventsSectionProps = {
  events: FirebaseEvent[];
};

export function HomeEventsSection({ events }: HomeEventsSectionProps) {
  const visible = events.slice(0, 3);

  return (
    <section aria-labelledby="home-events-heading" className="space-y-5">
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
      : <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((event) => (
            <HomeEventCard key={event.id} event={event} />
          ))}
        </div>
      }
    </section>
  );
}
