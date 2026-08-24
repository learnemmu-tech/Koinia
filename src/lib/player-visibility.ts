import type { Queue } from "@/types";

import { hasPlayableAudio } from "@/lib/utils";

export function shouldShowPlayer(
  queue: Queue[],
  currentIndex: number,
  isPlayerInit: boolean
): boolean {
  if (!isPlayerInit || queue.length === 0) {
    return false;
  }

  const currentTrack = queue[currentIndex];
  return hasPlayableAudio(currentTrack?.download_url);
}
