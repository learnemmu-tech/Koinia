"use client";

import React from "react";
import Link from "next/link";
import {
  ChevronUp,
  CirclePlus,
  Loader2,
  Pause,
  Repeat,
  Repeat1,
  Shuffle,
  Volume,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useGlobalAudioPlayer } from "react-use-audio-player";

import {
  useCurrentSongIndex,
  useIsPlayerInit,
  useIsTyping,
  useQueue,
  useStreamQuality,
} from "@/hooks/use-store";
import { DEFAULT_SONG_COVER } from "@/config/site";
import { shouldShowPlayer } from "@/lib/player-visibility";
import {
  cn,
  formatDuration,
  getDownloadLink,
  getHref,
  getImageSrc,
} from "@/lib/utils";
import {
  registerPlaybackBridge,
  setPlaybackPlaying,
} from "@/lib/playback-bridge";
import { Icons } from "./icons";
import { ImageWithFallback } from "./image-with-fallback";
import { Queue } from "./queue";
import { Drawer, DrawerContent, DrawerTitle } from "./ui/drawer";
import { Skeleton } from "./ui/skeleton";
import { Slider, SliderRange, SliderThumb, SliderTrack } from "./ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { toast } from "sonner";

export function Player() {
  const [queue] = useQueue();
  const [currentIndex] = useCurrentSongIndex();
  const [isPlayerInit] = useIsPlayerInit();
  const showPlayer = shouldShowPlayer(queue, currentIndex, isPlayerInit);

  if (!showPlayer) {
    return null;
  }

  return <PlayerControls />;
}

function usePlayerEngine() {
  const [queue] = useQueue();
  const [streamQuality] = useStreamQuality();
  const [currentIndex, setCurrentIndex] = useCurrentSongIndex();
  const [isPlayerInit, setIsPlayerInit] = useIsPlayerInit();
  const [isTyping] = useIsTyping();
  const frameRef = React.useRef<number>(0);
  const [isShuffle, setIsShuffle] = React.useState(false);
  const [loopPlaylist, setLoopPlaylist] = React.useState(false);
  const [pos, setPos] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);

  const {
    load,
    playing,
    togglePlayPause,
    getPosition,
    isLoading,
    duration,
    loop,
    looping,
    mute,
    muted,
    volume,
    setVolume,
    seek,
    isReady,
  } = useGlobalAudioPlayer();

  React.useEffect(() => {
    return registerPlaybackBridge({
      toggle: () => {
        if (isPlayerInit) {
          togglePlayPause();
        } else {
          setIsPlayerInit(true);
        }
      },
    });
  }, [isPlayerInit, setIsPlayerInit, togglePlayPause]);

  React.useEffect(() => {
    setPlaybackPlaying(playing);
  }, [playing]);

  const onEndHandler = React.useCallback(() => {
    let index = currentIndex;

    if (isShuffle) {
      index = Math.floor(Math.random() * queue.length);
    } else if (currentIndex < queue.length - 1) {
      if (!looping) {
        index = currentIndex + 1;
      }
    } else if (loopPlaylist) {
      index = 0;
    }

    setCurrentIndex(index);
  }, [
    currentIndex,
    isShuffle,
    loopPlaylist,
    looping,
    queue.length,
    setCurrentIndex,
  ]);

  React.useEffect(() => {
    if (queue.length && isPlayerInit && queue[currentIndex]) {
      const currentSong = queue[currentIndex];
      const audioSrc = getDownloadLink(currentSong.download_url, streamQuality);

      try {
        load(audioSrc, {
          html5: true,
          autoplay: true,
          initialMute: false,
          onend: onEndHandler,
        });
      } catch {
        toast.error("Playback error occurred");
      }
    }
  }, [queue, streamQuality, currentIndex, isPlayerInit, load, onEndHandler]);

  React.useEffect(() => {
    if (isDragging || !playing) {
      return;
    }

    const animate = () => {
      setPos(getPosition());
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [getPosition, isDragging, playing]);

  function loopHandler() {
    if (!isReady) return;

    if (queue.length === 1) {
      loop(!looping);
      toast.success(
        looping ? "Looping disabled" : "Playing current song on repeat"
      );
    } else if (!looping && !loopPlaylist) {
      setLoopPlaylist(true);
      loop(false);
      toast.success("Looping playlist");
    } else if (!looping && loopPlaylist) {
      setLoopPlaylist(false);
      loop(true);
    } else if (looping) {
      loop(false);
    }
  }

  function skipToNext() {
    if (!isPlayerInit) setIsPlayerInit(true);

    let index = currentIndex;

    if (isShuffle) {
      index = Math.floor(Math.random() * queue.length);
    } else if (currentIndex < queue.length - 1) {
      index = currentIndex + 1;
    } else if (loopPlaylist) {
      index = 0;
    }

    setCurrentIndex(index);
  }

  function skipToPrev() {
    if (!isPlayerInit) setIsPlayerInit(true);

    if (getPosition() > 3) {
      seek(0);
      setPos(0);
      return;
    }

    let index = currentIndex;

    if (isShuffle) {
      index = Math.floor(Math.random() * queue.length);
    } else if (currentIndex > 0) {
      index = currentIndex - 1;
    } else if (loopPlaylist) {
      index = queue.length - 1;
    }

    setCurrentIndex(index);
  }

  function playPauseHandler() {
    if (isPlayerInit) {
      togglePlayPause();
    } else {
      setIsPlayerInit(true);
    }
  }

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === " " && !isTyping) {
        e.preventDefault();
        playPauseHandler();
      } else if (e.key === "n" || (e.shiftKey && e.key === "ArrowRight")) {
        skipToNext();
      } else if (e.key === "p" || (e.shiftKey && e.key === "ArrowLeft")) {
        skipToPrev();
      } else if (e.shiftKey && e.key === "ArrowUp") {
        setVolume(volume + 0.05);
      } else if (e.shiftKey && e.key === "ArrowDown") {
        setVolume(volume - 0.05);
      } else if (e.key === "l") {
        loopHandler();
      } else if (e.key === "s") {
        setIsShuffle((value) => !value);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return {
    queue,
    currentIndex,
    pos,
    setPos,
    isDragging,
    setIsDragging,
    isShuffle,
    setIsShuffle,
    loopPlaylist,
    playing,
    isLoading,
    duration,
    looping,
    mute,
    muted,
    volume,
    setVolume,
    seek,
    getPosition,
    isReady,
    loopHandler,
    skipToNext,
    skipToPrev,
    playPauseHandler,
  };
}

function PlayerControls() {
  const engine = usePlayerEngine();
  const [mobileExpanded, setMobileExpanded] = React.useState(false);
  const currentSong = engine.queue[engine.currentIndex];

  return (
    <>
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 border-t border-[#282828] bg-[#121212]",
          "animate-in slide-in-from-bottom-full duration-300",
          !engine.isReady && "opacity-95"
        )}
      >
        {/* Mobile compact bar */}
        <div className="flex items-center gap-3 px-3 py-2.5 lg:hidden">
          <NowPlayingMeta
            song={currentSong}
            compact
            onExpand={() => setMobileExpanded(true)}
          />
          <PlayPauseButton engine={engine} size="md" />
          <button
            type="button"
            aria-label="Expand player"
            onClick={() => setMobileExpanded(true)}
            className="shrink-0 rounded-full p-2 text-[#b3b3b3] transition-colors hover:text-white"
          >
            <ChevronUp className="size-5" />
          </button>
        </div>

        {/* Desktop — Spotify-style three-column layout */}
        <div className="hidden h-[90px] grid-cols-[minmax(180px,30%)_minmax(480px,40%)_minmax(180px,30%)] items-center gap-4 px-4 lg:grid">
          <NowPlayingMeta song={currentSong} />
          <CenterControls engine={engine} />
          <VolumeControls engine={engine} showQueue />
        </div>
      </div>

      <Drawer open={mobileExpanded} onOpenChange={setMobileExpanded}>
        <DrawerContent className="border-[#282828] bg-[#121212] px-4 pb-8 pt-2">
          <DrawerTitle className="sr-only">Now playing</DrawerTitle>
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#4d4d4d]" />
          <div className="flex flex-col items-center gap-5">
            <div className="relative aspect-square w-full max-w-[280px] overflow-hidden rounded-md shadow-2xl">
              {currentSong?.image ?
                <ImageWithFallback
                  src={getImageSrc(currentSong.image, "low")}
                  alt={currentSong.name}
                  fill
                  fallback={DEFAULT_SONG_COVER}
                  className="object-cover"
                />
              : <Skeleton className="size-full" />}
            </div>
            <div className="w-full text-center">
              <p className="line-clamp-2 text-xl font-bold text-white">
                {currentSong?.name ?? "Unknown song"}
              </p>
              <p className="mt-1 line-clamp-1 text-sm text-[#b3b3b3]">
                {currentSong?.subtitle}
              </p>
            </div>
            <SpotifyProgressBar engine={engine} showTimes className="w-full" />
            <CenterControls engine={engine} className="w-full" mobile />
            <VolumeControls engine={engine} className="w-full justify-center" />
            <Queue />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

type Engine = ReturnType<typeof usePlayerEngine>;

const playerIconClass =
  "text-[#b3b3b3] transition-colors hover:text-white disabled:pointer-events-none disabled:opacity-40";

const playerActiveClass = "text-[#1db954] hover:text-[#1db954]";

function SpotifyProgressBar({
  engine,
  className,
  showTimes = false,
}: {
  engine: Engine;
  className?: string;
  showTimes?: boolean;
}) {
  const timeFormat = (value: number) =>
    formatDuration(value, value > 3600 ? "hh:mm:ss" : "mm:ss");

  return (
    <div className={cn("group/progress w-full", className)}>
      <div className="flex items-center gap-2">
        {showTimes ?
          <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-[#a7a7a7]">
            {timeFormat(engine.pos)}
          </span>
        : null}
        <Slider
          value={[engine.pos]}
          max={engine.duration || 100}
          onValueChange={([value]) => engine.setPos(value)}
          onPointerDown={() => engine.setIsDragging(true)}
          onValueCommit={() => {
            engine.seek(engine.pos);
            engine.setPos(engine.getPosition());
            engine.setIsDragging(false);
          }}
          className="flex-1"
        >
          <SliderTrack className="h-1 cursor-pointer bg-[#4d4d4d] group-hover/progress:h-1.5">
            <SliderRange className="bg-white" />
          </SliderTrack>
          <SliderThumb className="size-3 cursor-pointer border-none bg-white opacity-0 transition-opacity group-hover/progress:opacity-100 focus-visible:opacity-100" />
        </Slider>
        {showTimes ?
          <span className="w-10 shrink-0 text-[11px] tabular-nums text-[#a7a7a7]">
            {timeFormat(engine.duration)}
          </span>
        : null}
      </div>
    </div>
  );
}

function NowPlayingMeta({
  song,
  compact = false,
  onExpand,
}: {
  song: Engine["queue"][number] | undefined;
  compact?: boolean;
  onExpand?: () => void;
}) {
  const coverSize = compact ? "size-11" : "size-14";

  const content = (
    <>
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-[2px] bg-[#282828]",
          coverSize
        )}
      >
        {song?.image ?
          <ImageWithFallback
            src={getImageSrc(song.image, "low")}
            alt={song.name}
            fill
            sizes="56px"
            fallback={DEFAULT_SONG_COVER}
            className="object-cover"
          />
        : <Skeleton className="size-full" />}
      </div>
      <div className="min-w-0 flex-1">
        {song ?
          <>
            <Link
              href={getHref(song.url, song.type === "song" ? "song" : "episode")}
              className="line-clamp-1 text-sm font-normal text-white hover:underline"
            >
              {song.name}
            </Link>
            <p className="line-clamp-1 text-xs text-[#b3b3b3]">
              {song.subtitle}
            </p>
          </>
        : <>
            <Skeleton className="mb-1.5 h-3.5 w-32 bg-[#282828]" />
            <Skeleton className="h-3 w-24 bg-[#282828]" />
          </>
        }
      </div>
      {!compact && song ?
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Link
              href={getHref(song.url, song.type === "song" ? "song" : "episode")}
              aria-label={`View ${song.name}`}
              className="hidden shrink-0 text-[#b3b3b3] transition-colors hover:text-white sm:inline-flex"
            >
              <CirclePlus className="size-4" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="top">View song</TooltipContent>
        </Tooltip>
      : null}
    </>
  );

  if (compact) {
    return (
      <button
        type="button"
        onClick={onExpand}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        {content}
      </button>
    );
  }

  return <div className="flex min-w-0 items-center gap-3">{content}</div>;
}

function PlayPauseButton({
  engine,
  size = "lg",
}: {
  engine: Engine;
  size?: "md" | "lg";
}) {
  const isLarge = size === "lg";
  const iconClass = isLarge ? "size-4" : "size-3.5";
  const buttonClass = cn(
    "flex shrink-0 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105 active:scale-95 disabled:opacity-60",
    isLarge ? "size-8" : "size-7"
  );

  return (
    <button
      type="button"
      aria-label={engine.playing ? "Pause" : "Play"}
      onClick={engine.playPauseHandler}
      disabled={engine.isLoading}
      className={buttonClass}
    >
      {engine.isLoading ?
        <Loader2 className={cn(iconClass, "animate-spin text-black")} />
      : engine.playing ?
        <Pause className={cn(iconClass, "fill-black")} />
      : <Icons.Play className={cn(iconClass, "translate-x-0.5 fill-black")} />}
    </button>
  );
}

function CenterControls({
  engine,
  className,
  mobile = false,
}: {
  engine: Engine;
  className?: string;
  mobile?: boolean;
}) {
  const repeatActive = engine.looping || engine.loopPlaylist;

  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <div className="flex items-center justify-center gap-4 sm:gap-5">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={engine.isShuffle ? "Shuffle on" : "Shuffle off"}
              onClick={() => engine.setIsShuffle(!engine.isShuffle)}
              className={cn(
                playerIconClass,
                engine.isShuffle && playerActiveClass
              )}
            >
              <Shuffle className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">Shuffle</TooltipContent>
        </Tooltip>

        <button
          type="button"
          aria-label="Previous"
          onClick={engine.skipToPrev}
          className={playerIconClass}
        >
          <Icons.SkipBack className="size-5" />
        </button>

        <PlayPauseButton engine={engine} size="lg" />

        <button
          type="button"
          aria-label="Next"
          onClick={engine.skipToNext}
          className={playerIconClass}
        >
          <Icons.SkipForward className="size-5" />
        </button>

        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={repeatActive ? "Repeat on" : "Repeat off"}
              onClick={engine.loopHandler}
              className={cn(playerIconClass, repeatActive && playerActiveClass)}
            >
              {engine.looping ?
                <Repeat1 className="size-4" />
              : <Repeat className="size-4" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">Repeat</TooltipContent>
        </Tooltip>
      </div>

      {!mobile ?
        <SpotifyProgressBar engine={engine} showTimes className="max-w-[722px]" />
      : null}
    </div>
  );
}

function VolumeControls({
  engine,
  className,
  showQueue = false,
}: {
  engine: Engine;
  className?: string;
  showQueue?: boolean;
}) {
  return (
    <div className={cn("flex items-center justify-end gap-2", className)}>
      {showQueue ?
        <div className="hidden lg:block">
          <Queue />
        </div>
      : null}

      <button
        type="button"
        aria-label={engine.muted ? "Unmute" : "Mute"}
        onClick={() => {
          if (!engine.isReady) return;
          const newMuted = !engine.muted;
          engine.mute(newMuted);
          if (!newMuted && engine.volume === 0) {
            engine.setVolume(0.75);
          }
        }}
        className={cn(playerIconClass, engine.muted && "opacity-60")}
      >
        {engine.muted || engine.volume === 0 ?
          <VolumeX className="size-4" />
        : engine.volume < 0.33 ?
          <Volume className="size-4" />
        : engine.volume < 0.66 ?
          <Volume1 className="size-4" />
        : <Volume2 className="size-4" />}
      </button>

      <div className="group/volume hidden w-24 xl:block">
        <Slider
          aria-label="Volume"
          value={[engine.muted ? 0 : engine.volume * 100]}
          min={0}
          max={100}
          step={1}
          onValueChange={([value]) => {
            if (!engine.isReady) return;
            const newVolume = value / 100;
            engine.setVolume(newVolume);
            if (newVolume > 0 && engine.muted) {
              engine.mute(false);
            }
            if (newVolume === 0 && !engine.muted) {
              engine.mute(true);
            }
          }}
        >
          <SliderTrack className="h-1 cursor-pointer bg-[#4d4d4d] group-hover/volume:h-1.5">
            <SliderRange className="bg-white" />
          </SliderTrack>
          <SliderThumb className="size-3 cursor-pointer border-none bg-white opacity-0 transition-opacity group-hover/volume:opacity-100 focus-visible:opacity-100" />
        </Slider>
      </div>
    </div>
  );
}

export default Player;
