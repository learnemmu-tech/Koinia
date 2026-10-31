"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Loader2,
  Pause,
  Play,
} from "lucide-react";
import { toast } from "sonner";

import type { FirebaseSong } from "@/types/firebase-song";

import { FirebaseSongLyrics } from "@/components/music/firebase-song-lyrics";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlaySong } from "@/hooks/use-play-song";
import { useRecordRecentlyViewed } from "@/hooks/use-record-recently-viewed";
import {
  useCurrentSongIndex,
  useQueue,
} from "@/hooks/use-store";
import {
  generateLyricsTxt,
  getLyricsTxtFilename,
} from "@/lib/generate-lyrics-txt";
import { getSongLyricsContent } from "@/lib/song-lyrics";
import { getSongCoverUrl, cn } from "@/lib/utils";
import { DEFAULT_SONG_COVER } from "@/config/site";
import { YouTubeEmbed } from "@/components/media/youtube-embed";
import { getYouTubeWatchUrl } from "@/lib/media-url-validation";
import { incrementPlayCount } from "@/lib/song-play-count";
import {
  getSongAlternateTitle,
  getSongDisplayTitle,
} from "@/lib/song-firestore";
import {
  getPlaybackPlaying,
  subscribePlaybackPlaying,
  togglePlayback,
} from "@/lib/playback-bridge";
import { ContentActions } from "@/components/engagement/content-actions";
import { ShareSongButton } from "./share-song";

type SongDetailClientProps = {
  song: FirebaseSong;
  listHref?: string;
};

/** Pill-shaped hero action buttons — reference style */
const actionBtn =
  "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function downloadBlob(content: Blob, filename: string) {
  const url = URL.createObjectURL(content);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 150);
}

export function SongDetailClient({
  song,
  listHref = "/songs",
}: SongDetailClientProps) {
  useRecordRecentlyViewed({ itemType: "song", itemId: song.id });

  const [queue] = useQueue();
  const [currentIndex] = useCurrentSongIndex();
  const { playSong } = usePlaySong();
  const [downloadingLyrics, setDownloadingLyrics] = React.useState(false);
  const playing = React.useSyncExternalStore(
    subscribePlaybackPlaying,
    getPlaybackPlaying,
    () => false
  );

  const { english, translated, hasLyrics } = getSongLyricsContent(song);

  const audioUrl = song.audioUrl?.trim() ?? "";
  const coverUrl = getSongCoverUrl(song.imageUrl);
  const youtubeUrl = song.youtubeUrl?.trim() ?? "";
  const displayTitle = getSongDisplayTitle(song);
  const alternateTitle = getSongAlternateTitle(song) ?? "";
  const artistName = song.artist?.trim() ?? "";
  const playCount = song.playCount ?? 0;
  const songIndex = queue.findIndex((entry) => entry.id === song.id);
  const isCurrentSong = songIndex === currentIndex && songIndex !== -1;
  const isPlaying = isCurrentSong && playing;

  React.useEffect(() => {
    incrementPlayCount(song.id);
  }, [song.id]);

  function handlePlayClick() {
    if (!audioUrl) return;

    if (isCurrentSong) {
      togglePlayback();
      return;
    }

    playSong(song);
  }

  async function handleDownloadLyrics() {
    if (!hasLyrics) {
      toast.error("No lyrics available to download");
      return;
    }

    setDownloadingLyrics(true);
    try {
      const txtBlob = generateLyricsTxt({
        title: displayTitle,
        originalLyrics: translated,
        translationLyrics: english,
      });
      downloadBlob(txtBlob, getLyricsTxtFilename(displayTitle));
      toast.success("Lyrics downloaded");
    } catch {
      toast.error("Failed to download lyrics");
    } finally {
      setDownloadingLyrics(false);
    }
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-[850px] px-0 pb-10">
      <Link
        href={listHref}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        <ArrowLeft className="size-3.5 shrink-0" aria-hidden />
        Back to Songs
      </Link>

      {/* Song hero */}
      <article
        className={cn(
          "overflow-hidden rounded-2xl border border-border bg-card",
          "dark:border-[#202020] dark:bg-[#101010]"
        )}
      >
        <div className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-8">
          <div className="relative size-[150px] shrink-0 overflow-hidden rounded-[14px] border border-border sm:size-[180px]">
            <ImageWithFallback
              src={coverUrl}
              fallback={DEFAULT_SONG_COVER}
              width={180}
              height={180}
              sizes="(min-width: 640px) 180px, 150px"
              alt={displayTitle}
              className="size-full object-cover"
            />
            <Skeleton className="absolute inset-0 -z-10 size-full" />
            {audioUrl ?
              <button
                type="button"
                onClick={handlePlayClick}
                aria-label={isPlaying ? "Pause song" : "Play song"}
                className={cn(
                  "absolute bottom-2 right-2 flex size-9 items-center justify-center rounded-full",
                  "bg-foreground text-background shadow-md transition-opacity duration-200 hover:opacity-90",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                {isPlaying ?
                  <Pause className="size-4 fill-current" aria-hidden />
                : <Play className="size-4 fill-current pl-0.5" aria-hidden />}
              </button>
            : null}
          </div>

          <div className="flex min-w-0 flex-1 flex-col items-center gap-3.5 sm:items-start">
            <div className="w-full space-y-1 text-center sm:text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Worship Song
              </p>
              <h1 className="font-heading text-[30px] font-bold leading-[1.08] tracking-[-0.03em] text-foreground sm:text-[42px]">
                {displayTitle}
              </h1>
              {alternateTitle && alternateTitle !== displayTitle ?
                <p className="text-[15px] text-muted-foreground">{alternateTitle}</p>
              : null}
              {artistName ?
                <p className="text-[15px] text-muted-foreground">{artistName}</p>
              : null}
              {playCount > 0 ?
                <p className="text-[13px] text-muted-foreground/80">
                  {playCount.toLocaleString()} plays
                </p>
              : null}
            </div>

            <div className="flex max-w-full flex-wrap items-center justify-center gap-3 sm:justify-start">
              {hasLyrics ?
                <button
                  type="button"
                  disabled={downloadingLyrics}
                  onClick={handleDownloadLyrics}
                  className={cn(
                    actionBtn,
                    "bg-white text-black hover:bg-white/90 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/90"
                  )}
                >
                  {downloadingLyrics ?
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  : <Download className="size-3.5" aria-hidden />}
                  Lyrics
                </button>
              : null}

              <ContentActions
                likeType="song"
                itemId={song.id}
                saveType="song"
                layout="detail"
              />

              <ShareSongButton
                songId={song.id}
                songTitle={displayTitle}
                alternateTitle={alternateTitle}
                className={cn(
                  actionBtn,
                  "border border-border bg-muted/80 text-foreground hover:bg-muted",
                  "dark:border-[#2A2A2A] dark:bg-[#111111] dark:text-white dark:hover:bg-[#1A1A1A]"
                )}
              />
            </div>
          </div>
        </div>
      </article>

      {getYouTubeWatchUrl(youtubeUrl) ?
        <div className="mt-6 overflow-hidden rounded-2xl">
          <div className="aspect-video w-full">
            <YouTubeEmbed title={displayTitle} youtubeUrl={youtubeUrl} framed={false} />
          </div>
        </div>
      : null}

      {/* Lyrics card */}
      <section id="song-lyrics" className="mt-8 scroll-mt-24">
        {hasLyrics ?
          <FirebaseSongLyrics
            englishLyrics={english}
            translatedLyrics={translated}
            variant="song-detail"
          />
        : <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-14 text-center dark:border-[#202020]">
            <p className="text-sm text-muted-foreground">No lyrics available</p>
            <p className="text-xs text-muted-foreground/80">
              Lyrics haven&apos;t been added yet.
            </p>
          </div>
        }
      </section>
    </div>
  );
}
