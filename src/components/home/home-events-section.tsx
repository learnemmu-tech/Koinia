import type { FirebaseEvent } from "@/types/firebase-event";

import { HomeCollectionRail, homeRailItemClass } from "./home-collection-rail";
import { HomeEmptyState } from "./home-empty-state";
import { HomeEventCard } from "./home-event-card";
import { HomeSectionHeader } from "./home-section-header";

type HomeEventsSectionProps = {
  events: FirebaseEvent[];
};

export function HomeEventsSection({ events }: HomeEventsSectionProps) {
  const visible = events.slice(0, 3);

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
      : <HomeCollectionRail className="md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-4">
          {visible.map((event) => (
            <div
              key={event.id}
              className={homeRailItemClass("w-[16.5rem] md:w-auto md:min-w-0")}
            >
              <HomeEventCard event={event} />
            </div>
          ))}
        </HomeCollectionRail>
      }
    </section>
  );
}
