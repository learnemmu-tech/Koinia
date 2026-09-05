import type { FirebaseSermon } from "@/types/firebase-sermon";

import { FirebaseSermonCard } from "@/components/worship/firebase-sermon-card";

import { HomeCollectionRail, homeRailItemClass } from "./home-collection-rail";
import { HomeEmptyState } from "./home-empty-state";
import { HomeSectionHeader } from "./home-section-header";

type HomeSermonsSectionProps = {
  sermons: FirebaseSermon[];
};

export function HomeSermonsSection({ sermons }: HomeSermonsSectionProps) {
  const visible = [...sermons]
    .sort((a, b) => b.dateCreated - a.dateCreated)
    .slice(0, 4);

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
      : <HomeCollectionRail className="md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-4">
          {visible.map((sermon) => (
            <div
              key={sermon.id}
              className={homeRailItemClass("w-[16.5rem] md:w-auto")}
            >
              <FirebaseSermonCard sermon={sermon} />
            </div>
          ))}
        </HomeCollectionRail>
      }
    </section>
  );
}
