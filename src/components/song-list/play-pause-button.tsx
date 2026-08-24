"use client";

import { Pause, Play } from "lucide-react";
import { useGlobalAudioPlayer } from "react-use-audio-player";

import {
  useCurrentSongIndex,
  useIsPlayerInit,
  useQueue,
} from "@/hooks/use-store";
import { cn } from "@/lib/utils";

type TilePlayPauseButtonProps = {
  id: string;
  type?: string;
  token?: string;
};

export function TilePlayPauseButton(props: TilePlayPauseButtonProps) {
  const { id } = props;
  const [queue] = useQueue();
  const [currentIndex, setCurrentIndex] = useCurrentSongIndex();
  const [, setIsPlayerInit] = useIsPlayerInit();
  const { playing, play, pause } = useGlobalAudioPlayer();

  const songIndex = queue.findIndex((song) => song.id === id);
  const isCurrentSong = songIndex === currentIndex && songIndex !== -1;
  const Icon = playing ? Pause : Play;

  if (isCurrentSong) {
    return (
      <button
        type="button"
        aria-label={playing ? "Pause" : "Play"}
        onClick={playing ? pause : play}
        className="absolute inset-0 z-10 w-full bg-black/40 text-secondary dark:bg-black/75"
      >
        <Icon
          strokeWidth={playing ? 2 : 9}
          className={cn(
            "m-auto h-full w-6 p-1 duration-300 hover:w-8 dark:invert",
            playing && "p-0.5"
          )}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label="Play"
      onClick={() => {
        if (songIndex !== -1) {
          setCurrentIndex(songIndex);
          setIsPlayerInit(true);
        }
      }}
      className="absolute inset-0 z-20 w-full bg-black/40 text-secondary opacity-0 transition-opacity group-hover:opacity-100 dark:bg-black/75"
    >
      <Play
        strokeWidth={9}
        className="m-auto h-full w-6 p-1 duration-300 hover:w-8 dark:invert"
      />
    </button>
  );
}
