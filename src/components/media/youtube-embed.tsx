"use client";

import { getYouTubeEmbedUrl } from "@/lib/media-url-validation";

type YouTubeEmbedProps = {
  title: string;
  youtubeUrl?: string;
};

export function YouTubeEmbed({ title, youtubeUrl }: YouTubeEmbedProps) {
  const embedSrc = youtubeUrl ? getYouTubeEmbedUrl(youtubeUrl) : null;
  if (!embedSrc) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-card/40">
      <div className="aspect-video w-full md:aspect-[21/9]">
        <iframe
          src={embedSrc}
          title={`YouTube video for ${title}`}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
