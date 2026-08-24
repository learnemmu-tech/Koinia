"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight } from "lucide-react";

import type { FirebaseSong } from "@/types/firebase-song";

import {
  FirebaseSongCard,
  songsPageGridClassName,
} from "@/components/music/firebase-song-card";
import { TabEmptyState } from "@/components/worship/songs-tab-content";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeSongs } from "@/hooks/use-worship-realtime";
import { filterPublishedSongs, sortSongsByLatest } from "@/lib/song-firestore";

type HomeSongsSectionProps = {
  initialSongs: FirebaseSong[];
};

export function HomeSongsSection({ initialSongs }: HomeSongsSectionProps) {
  const { data: liveSongs, syncing } = useRealtimeSongs(initialSongs);
  const songs = useMemo(
    () => sortSongsByLatest(filterPublishedSongs(liveSongs)),
    [liveSongs]
  );

  const loading = syncing && songs.length === 0;

  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/60">
            Worship Collection
          </p>
          <h2 className="font-heading text-xl font-bold sm:text-2xl">Songs</h2>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0 rounded-full">
          <Link href="/songs">
            View All Songs
            <ArrowRight className="ml-1.5 size-3.5" />
          </Link>
        </Button>
      </div>

      {loading ?
        <div className={songsPageGridClassName}>
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="space-y-3 rounded-lg p-2.5">
              <Skeleton className="aspect-square w-full rounded-md" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      : songs.length === 0 ?
        <TabEmptyState message="No songs available yet. Check back soon." />
      : <div className={songsPageGridClassName}>
          {songs.map((song) => (
            <FirebaseSongCard key={song.id} song={song} />
          ))}
        </div>
      }
    </section>
  );
}
