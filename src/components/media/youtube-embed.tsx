"use client";

import { getYouTubeEmbedUrl } from "@/lib/media-url-validation";
import { cn } from "@/lib/utils";

type YouTubeEmbedProps = {
  title: string;
  youtubeUrl?: string;
  /** When false, render only the iframe (parent supplies frame/aspect). */
  framed?: boolean;
  className?: string;
};

export function YouTubeEmbed({
  title,
  youtubeUrl,
  framed = true,
  className,
}: YouTubeEmbedProps) {
  const embedSrc = youtubeUrl ? getYouTubeEmbedUrl(youtubeUrl) : null;
  if (!embedSrc) return null;

  const iframe = (
    <iframe
      src={embedSrc}
      title={`YouTube video for ${title}`}
      className="h-full w-full"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );

  if (!framed) {
    return <div className={cn("h-full w-full", className)}>{iframe}</div>;
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/50 bg-card/40",
        className
      )}
    >
      <div className="aspect-video w-full">{iframe}</div>
    </div>
  );
}
