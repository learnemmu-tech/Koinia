"use client";

import { useEffect } from "react";

import {
  useCurrentSongIndex,
  useIsPlayerInit,
  useQueue,
} from "@/hooks/use-store";
import { shouldShowPlayer } from "@/lib/player-visibility";
import { hasPlayableAudio } from "@/lib/utils";

export function usePlayerVisible() {
  const [queue, setQueue] = useQueue();
  const [currentIndex, setCurrentIndex] = useCurrentSongIndex();
  const [isPlayerInit, setIsPlayerInit] = useIsPlayerInit();

  useEffect(() => {
    if (!queue.length) {
      if (isPlayerInit) {
        setIsPlayerInit(false);
      }
      return;
    }

    const currentTrack = queue[currentIndex];
    if (!hasPlayableAudio(currentTrack?.download_url)) {
      setQueue([]);
      setCurrentIndex(0);
      setIsPlayerInit(false);
    }
  }, [
    queue,
    currentIndex,
    isPlayerInit,
    setCurrentIndex,
    setIsPlayerInit,
    setQueue,
  ]);

  return shouldShowPlayer(queue, currentIndex, isPlayerInit);
}
