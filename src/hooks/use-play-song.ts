"use client";

import { useCallback } from "react";

import type { FirebaseSong } from "@/types/firebase-song";
import type { Queue } from "@/types";

import {
  useCurrentSongIndex,
  useIsPlayerInit,
  useQueue,
} from "@/hooks/use-store";
import { getSongArtistLine, getSongDisplayTitle } from "@/lib/song-firestore";
import { getSongCoverUrl } from "@/lib/utils";

function buildQueueItem(song: FirebaseSong): Queue | null {
  const audioUrl = song.audioUrl?.trim();
  if (!audioUrl || !song.id?.trim()) return null;

  const displayTitle = getSongDisplayTitle(song);
  const artistLine = getSongArtistLine(song);

  return {
    id: song.id,
    name: displayTitle,
    subtitle: artistLine ?? "",
    image: getSongCoverUrl(song.imageUrl),
    duration: 0,
    download_url: audioUrl,
    url: `/songs/${encodeURIComponent(song.id)}`,
    type: "song",
    artists: [],
  };
}

export function usePlaySong() {
  const [queue, setQueue] = useQueue();
  const [, setCurrentIndex] = useCurrentSongIndex();
  const [, setIsPlayerInit] = useIsPlayerInit();

  const playSong = useCallback(
    (song: FirebaseSong, options?: { replaceQueue?: boolean }) => {
      const item = buildQueueItem(song);
      if (!item) return false;

      const existingIndex = queue.findIndex((entry) => entry.id === song.id);

      if (existingIndex !== -1) {
        setCurrentIndex(existingIndex);
        setIsPlayerInit(true);
        return true;
      }

      if (options?.replaceQueue === false) {
        setQueue([...queue, item]);
        setCurrentIndex(queue.length);
      } else {
        setQueue([item]);
        setCurrentIndex(0);
      }

      setIsPlayerInit(true);
      return true;
    },
    [queue, setCurrentIndex, setIsPlayerInit, setQueue]
  );

  const playSongAtIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= queue.length) return;
      setCurrentIndex(index);
      setIsPlayerInit(true);
    },
    [queue.length, setCurrentIndex, setIsPlayerInit]
  );

  return { playSong, playSongAtIndex, buildQueueItem };
}
