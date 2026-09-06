import type { FirebaseSermon } from "@/types/firebase-sermon";

import { FirebaseSermonCard } from "@/components/worship/firebase-sermon-card";

import { HomeCollectionRail, homeRailItemClass, HOME_RAIL_LANDSCAPE } from "./home-collection-rail";
import { HomeEmptyState } from "./home-empty-state";
import { HomeSectionHeader } from "./home-section-header";

type HomeSermonsSectionProps = {
  sermons: FirebaseSermon[];
};

export function HomeSermonsSection({ sermons }: HomeSermonsSectionProps) {
  const visible = [...sermons]
    .sort((a, b) => b.dateCreated - a.dateCreated)
    .slice(0, 3);

  return (
    <section aria-labelledby="home-sermons-heading" className="space-y-3">
      <HomeSectionHeader
        id="home-sermons-heading"
        title="Latest Sermons"
        description="Messages to encourage, teach, and strengthen your faith."
        href="/sermons"
      />
      {visible.length === 0 ?
        <HomeEmptyState
          title="No sermons yet"
          description="Check back soon for new messages."
        />
      : <HomeCollectionRail className="md:mx-0 md:grid md:max-w-4xl md:grid-cols-3 md:items-stretch md:overflow-visible md:px-0">
          {visible.map((sermon) => (
            <div
              key={sermon.id}
              className={homeRailItemClass(HOME_RAIL_LANDSCAPE)}
            >
              <FirebaseSermonCard sermon={sermon} className="h-full w-full" />
            </div>
          ))}
        </HomeCollectionRail>
      }
    </section>
  );
}
