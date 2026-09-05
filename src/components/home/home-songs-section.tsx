import type { FirebaseSong } from "@/types/firebase-song";

import { FirebaseSongCard } from "@/components/music/firebase-song-card";

import { HomeCollectionRail, homeRailItemClass } from "./home-collection-rail";
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
      : <HomeCollectionRail>
          {visible.map((song) => (
            <div key={song.id} className={homeRailItemClass("w-[9.75rem] sm:w-[11rem]")}>
              <FirebaseSongCard song={song} />
            </div>
          ))}
        </HomeCollectionRail>
      }
    </section>
  );
}
