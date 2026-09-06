"use client";

import React from "react";
import { Loader2, Play, Volume2, VolumeX } from "lucide-react";

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

const muteBtn =
  "pointer-events-auto flex size-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors duration-200 active:bg-black/60 hover-hover:hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40";

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
  const [showPlayHint, setShowPlayHint] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [failed, setFailed] = React.useState(false);
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

    setFailed(false);
    setLoading(true);

    if (active) {
      void video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      video.pause();
      setPlaying(false);
      video.currentTime = 0;
      setProgress(0);
      setShowPlayHint(true);
    }
  }, [active, playableSrc]);

  React.useEffect(() => {
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, []);

  function scheduleHidePlayHint() {
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    if (playing) {
      hideTimerRef.current = window.setTimeout(() => setShowPlayHint(false), 220);
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
    if (!video || !playableSrc || failed) return;
    if (video.paused) {
      void video.play();
      setPlaying(true);
      setShowPlayHint(false);
    } else {
      video.pause();
      setPlaying(false);
      setShowPlayHint(true);
    }
  }

  function toggleMute(event: React.MouseEvent) {
    event.stopPropagation();
    setMuted(!muted);
  }

  function retryPlayback(event: React.MouseEvent) {
    event.stopPropagation();
    const video = videoRef.current;
    if (!video || !playableSrc) return;
    setFailed(false);
    setLoading(true);
    video.load();
    void video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-black",
        immersive ? "h-full rounded-none" : "aspect-[9/16] rounded-2xl",
        className
      )}
      onClick={playableSrc && !failed ? togglePlay : undefined}
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
            setLoading(false);
          }}
          onWaiting={() => setLoading(true)}
          onPlaying={() => {
            setLoading(false);
            setFailed(false);
            scheduleHidePlayHint();
          }}
          onCanPlay={() => setLoading(false)}
          onError={() => {
            setFailed(true);
            setLoading(false);
            setPlaying(false);
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

      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/45 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/55 to-transparent" />

      <button
        type="button"
        aria-label={muted ? "Unmute" : "Mute"}
        onClick={toggleMute}
        className={cn("absolute right-3 top-3 z-20", muteBtn)}
      >
        {muted ?
          <VolumeX className="size-4" />
        : <Volume2 className="size-4" />}
      </button>

      {loading && !failed ?
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <Loader2 className="size-7 animate-spin text-white/80" aria-hidden />
          <span className="sr-only">Loading video</span>
        </div>
      : null}

      {failed ?
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/50 px-6 text-center">
          <p className="text-sm font-medium text-white">This video couldn’t play</p>
          <button
            type="button"
            onClick={retryPlayback}
            className="h-10 rounded-full bg-white/15 px-4 text-sm font-medium text-white backdrop-blur-sm active:bg-white/25"
          >
            Retry
          </button>
        </div>
      : null}

      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-200",
          !playing && !loading && !failed && showPlayHint ? "opacity-100" : "opacity-0"
        )}
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm">
          <Play className="ml-0.5 size-6 fill-current" aria-hidden />
        </span>
      </div>

      <div className="pointer-events-none absolute inset-x-3 bottom-2 z-10">
        <div className="h-0.5 overflow-hidden rounded-full bg-white/25">
          <div
            className="h-full rounded-full bg-white transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
});
