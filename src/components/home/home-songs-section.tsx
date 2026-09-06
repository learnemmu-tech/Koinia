import type { FirebaseSong } from "@/types/firebase-song";

import { FirebaseSongCard } from "@/components/music/firebase-song-card";
import { cn } from "@/lib/utils";

import { HomeCollectionRail, homeRailItemClass, HOME_RAIL_SQUARE } from "./home-collection-rail";
import { HomeEmptyState } from "./home-empty-state";
import { HomeSectionHeader } from "./home-section-header";

type HomeSongsSectionProps = {
  songs: FirebaseSong[];
};

export function HomeSongsSection({ songs }: HomeSongsSectionProps) {
  const visible = songs.slice(0, 5);

  return (
    <section id="songs" aria-labelledby="home-songs-heading" className="space-y-3">
      <HomeSectionHeader
        id="home-songs-heading"
        title="Worship Songs"
        description="Listen, worship, and discover songs from the community."
        href="/songs"
      />
      {visible.length === 0 ?
        <HomeEmptyState
          title="No songs yet"
          description="Check back soon for new worship songs."
        />
      : <HomeCollectionRail className="md:mx-0 md:grid md:grid-cols-3 md:items-start md:overflow-visible md:px-0 lg:grid-cols-5">
          {visible.map((song) => (
            <div
              key={song.id}
              className={cn(homeRailItemClass(HOME_RAIL_SQUARE), "min-w-0")}
            >
              <FirebaseSongCard song={song} className="h-full w-full min-w-0" />
            </div>
          ))}
        </HomeCollectionRail>
      }
    </section>
  );
}
