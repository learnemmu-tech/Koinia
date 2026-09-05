import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";

import { HomeCollectionRail, homeRailItemClass } from "./home-collection-rail";
import { HomeEmptyState } from "./home-empty-state";
import { HomePrayerCard } from "./home-prayer-card";
import { HomeSectionHeader } from "./home-section-header";

type HomePrayerSectionProps = {
  requests: FirebasePrayerRequest[];
};

export function HomePrayerSection({ requests }: HomePrayerSectionProps) {
  const visible = requests.slice(0, 4);

  return (
    <section aria-labelledby="home-prayer-heading" className="space-y-3">
      <HomeSectionHeader
        id="home-prayer-heading"
        title="Prayer Requests"
        description="Pray for others and lift one another up in faith."
        href="/prayer-requests"
      />
      {visible.length === 0 ?
        <HomeEmptyState
          title="No prayer requests yet"
          description="Check back soon to pray with the community."
        />
      : <HomeCollectionRail className="md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-4">
          {visible.map((request) => (
            <div
              key={request.id}
              className={homeRailItemClass("w-[16.5rem] md:w-auto")}
            >
              <HomePrayerCard request={request} />
            </div>
          ))}
        </HomeCollectionRail>
      }
    </section>
  );
}
