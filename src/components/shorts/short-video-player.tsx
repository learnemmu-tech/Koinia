"use client";

import React from "react";
import {
  Maximize2,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";

import { cn } from "@/lib/utils";

type ShortVideoPlayerProps = {
  src: string;
  poster?: string | null;
  active: boolean;
  className?: string;
  immersive?: boolean;
  muted?: boolean;
  onMutedChange?: (muted: boolean) => void;
  onDuration?: (seconds: number) => void;
};

const controlBtn =
  "pointer-events-auto flex size-9 items-center justify-center rounded-full bg-background/25 text-foreground backdrop-blur-sm transition-colors active:bg-background/40 hover-hover:hover:bg-background/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

export const ShortVideoPlayer = React.memo(function ShortVideoPlayer({
  src,
  poster,
  active,
  className,
  immersive = false,
  muted: mutedProp,
  onMutedChange,
  onDuration,
}: ShortVideoPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [internalMuted, setInternalMuted] = React.useState(true);
  const muted = mutedProp ?? internalMuted;
  const [progress, setProgress] = React.useState(0);
  const [showControls, setShowControls] = React.useState(true);
  const hideTimerRef = React.useRef<number | null>(null);
  const playableSrc = src?.trim() ?? "";

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
  }, [muted]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !playableSrc) return;

    if (active) {
      void video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      video.pause();
      setPlaying(false);
      video.currentTime = 0;
      setProgress(0);
    }
  }, [active, playableSrc]);

  React.useEffect(() => {
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, []);

  function scheduleHideControls() {
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    if (immersive && playing) {
      hideTimerRef.current = window.setTimeout(() => setShowControls(false), 2200);
    }
  }

  function setMuted(next: boolean) {
    if (onMutedChange) onMutedChange(next);
    else setInternalMuted(next);
    const video = videoRef.current;
    if (video) video.muted = next;
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video || !playableSrc) return;
    if (video.paused) {
      void video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
    setShowControls(true);
    scheduleHideControls();
  }

  function toggleMute(event: React.MouseEvent) {
    event.stopPropagation();
    setMuted(!muted);
    setShowControls(true);
    scheduleHideControls();
  }

  function toggleFullscreen(event: React.MouseEvent) {
    event.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void video.requestFullscreen?.();
    }
  }

  function revealControls() {
    setShowControls(true);
    scheduleHideControls();
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-black/90",
        immersive ? "h-full rounded-none" : "aspect-[9/16] rounded-2xl",
        className
      )}
      onClick={playableSrc ? togglePlay : undefined}
      onMouseMove={revealControls}
      onTouchStart={revealControls}
    >
      {playableSrc ?
        <video
          ref={videoRef}
          src={playableSrc}
          poster={poster ?? undefined}
          playsInline
          muted={muted}
          loop
          preload={active ? "auto" : "metadata"}
          className="size-full object-cover"
          onLoadedMetadata={(event) => {
            const duration = event.currentTarget.duration;
            if (Number.isFinite(duration)) {
              onDuration?.(Math.round(duration));
            }
          }}
          onTimeUpdate={(event) => {
            const video = event.currentTarget;
            if (video.duration) {
              setProgress((video.currentTime / video.duration) * 100);
            }
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      : <div className="size-full bg-muted" aria-hidden />}

      {immersive ?
        <>
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background/50 to-transparent transition-opacity duration-200",
              showControls || !playing ? "opacity-100" : "opacity-0"
            )}
          />
          <div
            className={cn(
              "absolute right-3 top-3 z-20 flex items-center gap-1.5 transition-opacity duration-200",
              showControls || !playing ? "opacity-100" : "opacity-0"
            )}
          >
            <button
              type="button"
              aria-label={muted ? "Unmute" : "Mute"}
              onClick={toggleMute}
              className={controlBtn}
            >
              {muted ?
                <VolumeX className="size-4" />
              : <Volume2 className="size-4" />}
            </button>
            <button
              type="button"
              aria-label="Fullscreen"
              onClick={toggleFullscreen}
              className={controlBtn}
            >
              <Maximize2 className="size-3.5" />
            </button>
          </div>
        </>
      : null}

      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-200",
          showControls || !playing ? "opacity-100" : "opacity-0"
        )}
      />

      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity duration-200",
          playing && !showControls ? "opacity-0" : "opacity-100"
        )}
      >
        {!playing ?
          <span className="flex size-14 items-center justify-center rounded-full bg-background/20 text-foreground backdrop-blur-sm">
            <Play className="ml-0.5 size-6 fill-current" aria-hidden />
          </span>
        : null}
      </div>

      <div
        className={cn(
          "absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 transition-opacity duration-200",
          !immersive && showControls ? "opacity-100" : immersive ? "opacity-100" : "opacity-0",
          immersive && "bottom-2 left-2 right-2"
        )}
      >
        <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-foreground/20">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
        {!immersive ?
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={muted ? "Unmute" : "Mute"}
              onClick={toggleMute}
              className={controlBtn}
            >
              {muted ?
                <VolumeX className="size-4" />
              : <Volume2 className="size-4" />}
            </button>
            <button
              type="button"
              aria-label="Fullscreen"
              onClick={toggleFullscreen}
              className={controlBtn}
            >
              <Maximize2 className="size-3.5" />
            </button>
          </div>
        : null}
      </div>

      {playing ?
        <span className="sr-only">
          <Pause aria-hidden />
        </span>
      : null}
    </div>
  );
});
