"use client";

import type { FirebaseSong } from "@/types/firebase-song";

import { FirebaseSongCard, songsAlbumGridClassName } from "@/components/music/firebase-song-card";
import { useRealtimeSongs } from "@/hooks/use-worship-realtime";
import { filterPublishedSongs } from "@/lib/song-firestore";

type FirebaseSongsSectionProps = {
  songs: FirebaseSong[];
};

export function FirebaseSongsSection({ songs }: FirebaseSongsSectionProps) {
  const { data } = useRealtimeSongs(songs);
  const liveSongs = filterPublishedSongs(data.length > 0 ? data : songs);

  if (liveSongs.length === 0) {
    return (
      <section className="w-full">
        <SectionHeader count={0} />
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/30 py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-muted-foreground">No songs yet</p>
          <p className="mt-1 text-xs text-muted-foreground/60">New worship songs will appear here.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full space-y-5">
      <SectionHeader count={liveSongs.length} />

      <div className={songsAlbumGridClassName}>
        {liveSongs.map((song) => (
          <FirebaseSongCard key={song.id} song={song} />
        ))}
      </div>
    </section>
  );
}

function SectionHeader({ count }: { count: number }) {
  return (
    <div className="flex items-end justify-between">
      <div className="space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/60">
          Worship Collection
        </p>
        <h2 className="font-heading text-xl font-bold sm:text-2xl md:text-3xl">
          Songs
        </h2>
      </div>
      {count > 0 && (
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {count} {count === 1 ? "song" : "songs"}
        </span>
      )}
    </div>
  );
}
