"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  Download,
  Loader2,
  Music2,
  Pause,
  PlayCircle,
} from "lucide-react";
import { toast } from "sonner";

import type { FirebaseSong } from "@/types/firebase-song";

import { FirebaseSongLyrics } from "@/components/music/firebase-song-lyrics";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { Button } from "@/components/ui/button";
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
import { pageDetailClass } from "@/lib/responsive-classes";
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

/** Compact pill buttons for hero actions */
const actionBtn =
  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium sm:h-8 sm:px-3.5 sm:text-sm";

function downloadBlob(content: Blob, filename: string) {
  const url = URL.createObjectURL(content);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 150);
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
    <div className={cn(pageDetailClass, "w-full")}>
      <div className="py-4 sm:py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Songs
        </Link>
      </div>

      {/* Hero card — matches reference layout */}
      <article className="overflow-hidden rounded-2xl border border-border/50 bg-[#181818] shadow-sm">
        <div className="flex flex-col items-center gap-5 px-6 py-8 sm:flex-row sm:items-center sm:gap-6 sm:px-8 sm:py-10">
          {/* Cover */}
          <div className="relative shrink-0">
            <div className="relative h-36 w-36 overflow-hidden rounded-xl border border-border/40 shadow-lg sm:h-40 sm:w-40">
              <ImageWithFallback
                src={coverUrl}
                fallback={DEFAULT_SONG_COVER}
                width={160}
                height={160}
                sizes="160px"
                alt={displayTitle}
                className="size-full object-cover"
              />
              <Skeleton className="absolute inset-0 -z-10 size-full" />
            </div>
          </div>

          {/* Info + actions */}
          <div className="flex min-w-0 flex-1 flex-col items-center gap-4 sm:items-start">
            <div className="space-y-1 text-center sm:text-left">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/70">
                Worship Song
              </p>
              <h1 className="font-heading text-[clamp(1.5rem,1.2rem+1.2vw,2.25rem)] font-bold leading-tight text-white">
                {displayTitle}
              </h1>
              {alternateTitle && alternateTitle !== displayTitle ?
                <p className="text-base font-medium text-muted-foreground sm:text-lg">
                  {alternateTitle}
                </p>
              : null}
              {artistName ?
                <p className="text-sm text-muted-foreground">{artistName}</p>
              : null}
              {playCount > 0 ?
                <p className="text-xs text-muted-foreground">
                  {playCount.toLocaleString()} plays
                </p>
              : null}
            </div>

            <div className="flex max-w-full flex-wrap items-center justify-center gap-1.5 sm:justify-start sm:gap-2">
              {audioUrl ?
                <Button
                  type="button"
                  onClick={handlePlayClick}
                  className={cn(
                    actionBtn,
                    "bg-[#1db954] font-semibold text-black shadow-sm hover:bg-[#1ed760]"
                  )}
                >
                  {isPlaying ?
                    <Pause className="size-3.5 fill-current" />
                  : <PlayCircle className="size-3.5 fill-current" />}
                  {isPlaying ? "Pause" : "Play"}
                </Button>
              : null}

              {hasLyrics ?
                <Button
                  type="button"
                  disabled={downloadingLyrics}
                  onClick={handleDownloadLyrics}
                  className={cn(
                    actionBtn,
                    "bg-white font-semibold text-black shadow-sm hover:bg-white/90"
                  )}
                >
                  {downloadingLyrics ?
                    <Loader2 className="size-3.5 animate-spin" />
                  : <Download className="size-3.5" />}
                  Lyrics
                </Button>
              : null}

              {youtubeUrl ?
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    actionBtn,
                    "border border-red-500/40 bg-red-500/10 text-red-400 transition-colors hover:bg-red-500/20"
                  )}
                >
                  <svg className="size-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                  YouTube
                </a>
              : null}

              <ShareSongButton
                songId={song.id}
                songTitle={displayTitle}
                alternateTitle={alternateTitle}
                className={cn(
                  actionBtn,
                  "border border-border/60 bg-transparent text-foreground hover:bg-white/5"
                )}
              />
            </div>
          </div>
        </div>

        {/* Watch video — inside card footer */}
        {embedSrc && (
          <div className="border-t border-border/40 px-6 py-4 sm:px-8">
            <button
              type="button"
              onClick={() => setShowVideo((s) => !s)}
              className="flex w-full items-center justify-between gap-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="flex items-center gap-2">
                <PlayCircle className="size-4 text-red-500" />
                {showVideo ? "Hide video" : "Watch song video"}
              </span>
              <ChevronDown
                className={cn(
                  "size-4 transition-transform duration-200",
                  showVideo && "rotate-180"
                )}
              />
            </button>
            {showVideo && (
              <div className="mt-4 overflow-hidden rounded-xl border border-border/50">
                <div className="relative" style={{ paddingTop: "56.25%" }}>
                  <iframe
                    src={embedSrc}
                    title={`YouTube video for ${displayTitle}`}
                    className="absolute inset-0 h-full w-full"
                    frameBorder={0}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </article>

      {/* Lyrics */}
      <section id="song-lyrics" className="mt-6 scroll-mt-24">
        {hasLyrics ?
          <div className="overflow-hidden rounded-2xl border border-border/50 bg-[#181818]">
            <div className="border-b border-border/40 px-6 py-4 sm:px-8">
              <div className="flex items-center gap-2">
                <Music2 className="h-4 w-4 text-primary" aria-hidden />
                <h2 className="font-heading text-base font-semibold sm:text-lg">
                  Lyrics
                </h2>
              </div>
            </div>
            <div className="px-6 py-6 sm:px-8 sm:py-8">
              <FirebaseSongLyrics
                englishLyrics={english}
                translatedLyrics={translated}
              />
            </div>
          </div>
        : <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/30">
              <Music2 className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">No lyrics available</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Lyrics for this song haven&apos;t been added yet.
              </p>
            </div>
          </div>
        }
      </section>
    </div>
  );
}
