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
    <div className="space-y-6">
      <YouTubeEmbed title={title} youtubeUrl={youtubeUrl} />

      {audio ? (
        <FirebaseSongPlayer audioUrl={audio} title={title} />
      ) : null}
    </div>
  );
}
