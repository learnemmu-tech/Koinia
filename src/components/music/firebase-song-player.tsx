"use client";

import React from "react";
import { Pause, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider, SliderRange, SliderThumb, SliderTrack } from "@/components/ui/slider";
import { formatDuration } from "@/lib/utils";

type FirebaseSongPlayerProps = {
  audioUrl: string;
  title: string;
};

export function FirebaseSongPlayer({ audioUrl, title }: FirebaseSongPlayerProps) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [duration, setDuration] = React.useState(0);
  const [pos, setPos] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

  function togglePlayPause() {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      void audio.play();
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  function handleSeek(value: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setPos(value);
  }

  if (!audioUrl) {
    console.warn("[Player] No audio URL available for playback");
    return (
      <p className="text-sm text-muted-foreground">
        Audio is not available for this song.
      </p>
    );
  }

  return (
    <div className="w-full max-w-2xl space-y-4 rounded-lg border bg-card p-4">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onLoadedMetadata={(e) => {          setDuration(e.currentTarget.duration);
          setIsLoading(false);
        }}
        onTimeUpdate={(e) => setPos(e.currentTarget.currentTime)}
        onEnded={() => {          setPlaying(false);
        }}
        onWaiting={() => {          setIsLoading(true);
        }}
        onCanPlay={() => {          setIsLoading(false);
        }}
        onError={(e) => {
          const error = e.currentTarget.error;
          console.error("[Player] Audio error:", {
            title,
            audioUrl,
            errorCode: error?.code,
            errorMessage: error?.message,
          });
          setIsLoading(false);
        }}
      />

      <div className="flex items-center gap-4">
        <Button
          size="icon"
          variant="secondary"
          className="size-12 shrink-0 rounded-full"
          onClick={togglePlayPause}
          disabled={isLoading}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ?
            <Pause className="size-5" />
          : <Play className="size-5" />}
        </Button>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">
            {formatDuration(pos, "mm:ss")} / {formatDuration(duration || 0, "mm:ss")}
          </p>
        </div>
      </div>

      <Slider
        value={[pos]}
        max={duration || 100}
        step={1}
        onValueCommit={([value]) => handleSeek(value)}
        disabled={isLoading || !duration}
      >
        <SliderTrack>
          <SliderRange />
        </SliderTrack>
        <SliderThumb />
      </Slider>
    </div>
  );
}
