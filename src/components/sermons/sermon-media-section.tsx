"use client";

import { FirebaseSongPlayer } from "@/components/music/firebase-song-player";
import { YouTubeEmbed } from "@/components/media/youtube-embed";

type SermonMediaSectionProps = {
  title: string;
  youtubeUrl?: string;
  audioUrl?: string;
};

export function SermonMediaSection({
  title,
  youtubeUrl,
  audioUrl,
}: SermonMediaSectionProps) {
  const audio = audioUrl?.trim() ?? "";
  const hasVideo = Boolean(youtubeUrl && youtubeUrl.trim());

  if (!hasVideo && !audio) return null;

  return (
    <div className="space-y-5">
      {hasVideo ?
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="aspect-video w-full">
            <YouTubeEmbed title={title} youtubeUrl={youtubeUrl} framed={false} />
          </div>
        </div>
      : null}

      {audio ?
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5">
          <FirebaseSongPlayer audioUrl={audio} title={title} />
        </div>
      : null}
    </div>
  );
}
