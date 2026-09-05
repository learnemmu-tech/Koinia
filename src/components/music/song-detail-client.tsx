"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
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
import { ShareSongButton } from "./share-song";

type SongDetailClientProps = {
  song: FirebaseSong;
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

function RedPlayCircleIcon({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex size-[18px] shrink-0 items-center justify-center",
        className
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-[18px]" fill="none">
        <circle cx="12" cy="12" r="9.25" stroke="#FF0000" strokeWidth="1.5" />
        <path d="M10.2 8.4v7.2l5.4-3.6-5.4-3.6z" fill="#FF0000" />
      </svg>
    </span>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export function SongDetailClient({ song }: SongDetailClientProps) {
  useRecordRecentlyViewed({ itemType: "song", itemId: song.id });

  const [queue] = useQueue();
  const [currentIndex] = useCurrentSongIndex();
  const { playSong } = usePlaySong();
  const [showVideo, setShowVideo] = React.useState(false);
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

  function getYouTubeEmbedUrl(url: string) {
    if (!url) return null;
    const idMatch = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
    const id = idMatch ? idMatch[1] : null;
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  const embedSrc = getYouTubeEmbedUrl(youtubeUrl);
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
        href="/songs"
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

              {youtubeUrl ?
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    actionBtn,
                    "border border-[#7F1D1D] bg-[#2D1212] text-[#F87171] hover:bg-[#3a1818] dark:border-[#7F1D1D] dark:bg-[#2D1212] dark:text-[#F87171]"
                  )}
                >
                  <YouTubeIcon className="size-3.5 shrink-0" />
                  YouTube
                </a>
              : null}

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

        {embedSrc ?
          <>
            <button
              type="button"
              onClick={() => setShowVideo((value) => !value)}
              className={cn(
                "flex h-16 w-full items-center justify-between gap-3 border-t px-7 text-sm transition-colors duration-200",
                "border-border/60 hover:bg-accent/30",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                "dark:border-white/[0.06] dark:hover:bg-white/[0.03]"
              )}
            >
              <span className="flex items-center gap-2.5 text-muted-foreground dark:text-[#A1A1A1]">
                <RedPlayCircleIcon />
                Watch song video
              </span>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform duration-200 dark:text-[#737373]",
                  showVideo && "rotate-180"
                )}
                aria-hidden
              />
            </button>
            {showVideo ?
              <div className="border-t border-border/60 dark:border-white/[0.06]">
                <div className="relative aspect-video w-full">
                  <iframe
                    src={embedSrc}
                    title={`YouTube video for ${displayTitle}`}
                    className="absolute inset-0 size-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            : null}
          </>
        : null}
      </article>

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
