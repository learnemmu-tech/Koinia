"use client";

import React from "react";
import { Pause, Play } from "lucide-react";
import { useSyncExternalStore } from "react";

import { ProtectedContentLink } from "@/components/auth/protected-content-link";
import { AdminQuickEditButton } from "@/components/admin/admin-quick-edit-button";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import type { FirebaseSong } from "@/types/firebase-song";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { DEFAULT_SONG_COVER } from "@/config/site";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { usePlaySong } from "@/hooks/use-play-song";
import {
  useCurrentSongIndex,
  useQueue,
} from "@/hooks/use-store";
import {
  getPlaybackPlaying,
  subscribePlaybackPlaying,
  togglePlayback,
} from "@/lib/playback-bridge";
import { getSongArtistLine, getSongDisplayTitle } from "@/lib/song-firestore";
import { contentCardGridClassName } from "@/lib/responsive-classes";
import { cn, getSongCoverUrl } from "@/lib/utils";

type FirebaseSongCardProps = {
  song: FirebaseSong;
  className?: string;
};

function SongCoverPlayControl({
  song,
  displayTitle,
  isCurrentSong,
}: {
  song: FirebaseSong;
  displayTitle: string;
  isCurrentSong: boolean;
}) {
  const { playSong } = usePlaySong();
  const { ensureAuth } = useAuthGuard();
  const playing = useSyncExternalStore(
    subscribePlaybackPlaying,
    getPlaybackPlaying,
    () => false
  );

  const audioUrl = song.audioUrl?.trim() ?? "";
  const isPlaying = isCurrentSong && playing;

  if (!audioUrl) return null;

  function handlePlayClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!ensureAuth()) return;

    if (isCurrentSong) {
      togglePlayback();
      return;
    }

    playSong(song);
  }

  return (
    <button
      type="button"
      aria-label={isPlaying ? `Pause ${displayTitle}` : `Play ${displayTitle}`}
      onClick={handlePlayClick}
      className={cn(
        "absolute bottom-2 right-2 z-20 flex h-10 w-10 items-center justify-center rounded-full",
        "bg-primary text-primary-foreground",
        "translate-y-1 scale-90 opacity-0 transition-all duration-200 ease-out",
        "group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100",
        "group-focus-within:translate-y-0 group-focus-within:scale-100 group-focus-within:opacity-100",
        "hover:scale-105 active:scale-95",
        "focus-visible:translate-y-0 focus-visible:scale-100 focus-visible:opacity-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isPlaying && "translate-y-0 scale-100 opacity-100"
      )}
    >
      {isPlaying ? (
        <Pause className="h-4 w-4 fill-current" />
      ) : (
        <Play className="h-4 w-4 translate-x-0.5 fill-current" />
      )}
    </button>
  );
}

export const FirebaseSongCard = React.memo(function FirebaseSongCard({
  song,
  className,
}: FirebaseSongCardProps) {
  const [queue] = useQueue();
  const [currentIndex] = useCurrentSongIndex();

  if (!song.id?.trim()) return null;

  const songHref = `/songs/${encodeURIComponent(song.id)}`;
  const coverUrl = getSongCoverUrl(song.imageUrl);
  const displayTitle = getSongDisplayTitle(song);
  const artistLine = getSongArtistLine(song)?.trim() || song.category?.trim() || null;
  const linkLabel = artistLine
    ? `${displayTitle} by ${artistLine}`
    : displayTitle;
  const hasAudio = !!song.audioUrl?.trim();
  const songIndex = queue.findIndex((item) => item.id === song.id);
  const isCurrentSong = songIndex === currentIndex && songIndex !== -1;

  return (
    <article
      className={cn(
        "group relative w-full",
        "rounded-lg p-2.5",
        "cursor-pointer transition-all duration-200 ease-out",
        "hover:-translate-y-0.5 hover:bg-white/[0.08]",
        "focus-within:bg-white/[0.08]",
        className
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-muted/15">
        <ProtectedContentLink
          href={songHref}
          aria-label={linkLabel}
          className="block size-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
        >
          <ImageWithFallback
            src={coverUrl}
            fallback={DEFAULT_SONG_COVER}
            width={320}
            height={320}
            sizes="(max-width: 640px) 46vw, (max-width: 1024px) 24vw, 200px"
            alt=""
            aria-hidden
            className="size-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
          />
        </ProtectedContentLink>

        {hasAudio ?
          <SongCoverPlayControl
            song={song}
            displayTitle={displayTitle}
            isCurrentSong={isCurrentSong}
          />
        : null}

        <FavoriteButton
          itemType="song"
          itemId={song.id}
          className="absolute left-2 top-2 z-20"
        />

        <AdminQuickEditButton
          href={`/dashboard/content?tab=songs&edit=${encodeURIComponent(song.id)}`}
          label="Edit song"
          className="absolute right-2 top-2 z-20 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
        />
      </div>

      <ProtectedContentLink
        href={songHref}
        aria-label={`View ${linkLabel}`}
        className="mt-3 block min-w-0 px-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <h3 className="line-clamp-2 text-[15px] font-bold leading-[1.2] tracking-tight text-foreground">
          {displayTitle}
        </h3>

        {artistLine ?
          <p className="mt-0.5 line-clamp-2 text-[13px] font-normal leading-[1.25] text-[#b3b3b3]">
            {artistLine}
          </p>
        : null}
      </ProtectedContentLink>
    </article>
  );
});

/** Dense album grid — Songs page & home Songs section (5 per row on desktop). */
export const songsPageGridClassName =
  "grid w-full grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5";

/** Default album grid for favorites, search, etc. */
export const songsAlbumGridClassName = contentCardGridClassName;
