"use client";

import { Play } from "lucide-react";

import {
  getYouTubeThumbnailUrl,
  getYouTubeWatchUrl,
} from "@/lib/media-url-validation";
import { cn } from "@/lib/utils";

type YouTubeEmbedProps = {
  title: string;
  youtubeUrl?: string;
  /** Kept so existing call sites compile. Playback stays on YouTube. */
  framed?: boolean;
  autoPlay?: boolean;
  className?: string;
};

export function YouTubeEmbed({
  title,
  youtubeUrl,
  className,
}: YouTubeEmbedProps) {
  const watchUrl = youtubeUrl ? getYouTubeWatchUrl(youtubeUrl) : null;
  if (!watchUrl) return null;
  const thumbnail = youtubeUrl ? getYouTubeThumbnailUrl(youtubeUrl) : null;

  return (
    <a
      href={watchUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Play ${title} on YouTube`}
      className={cn(
        "group relative block h-full min-h-40 w-full cursor-pointer overflow-hidden bg-muted",
        className
      )}
    >
      {thumbnail ?
        <span
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${thumbnail})` }}
          role="img"
          aria-hidden
        />
      : null}
      <span className="absolute inset-0 bg-black/10 transition-colors duration-150 group-hover:bg-black/25" />
      <span className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-150 group-hover:scale-105">
        <Play className="ml-0.5 size-6 fill-[#EF4444] text-[#EF4444]" aria-hidden />
      </span>
    </a>
  );
}
