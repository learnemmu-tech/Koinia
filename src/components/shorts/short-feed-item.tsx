"use client";

import React from "react";

import type { VideoShort } from "@/types/video-short";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ShortVideoPlayer } from "@/components/shorts/short-video-player";
import { ShortActionRail } from "@/components/shorts/short-action-rail";
import { cn } from "@/lib/utils";

type ShortFeedItemProps = {
  short: VideoShort;
  active: boolean;
  liked: boolean;
  likeCount: number;
  commentCount: number;
  canManage: boolean;
  muted: boolean;
  onMutedChange: (muted: boolean) => void;
  onLike: () => void;
  onComments: () => void;
  getToken: () => Promise<string | null>;
  onDeleted?: () => void;
  onCoverUpdated?: (thumbnailUrl: string | null) => void;
  itemRef?: (node: HTMLDivElement | null) => void;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function CreatorCaptionBlock({
  short,
  expanded,
  onToggleExpanded,
  overlay,
  className,
}: {
  short: VideoShort;
  expanded: boolean;
  onToggleExpanded: () => void;
  overlay?: boolean;
  className?: string;
}) {
  const longCaption = short.caption.length > 90;

  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      <div className="flex items-center gap-2.5">
        <Avatar
          className={cn(
            "size-8 shrink-0",
            overlay ? "border border-white/25" : "border border-border/40"
          )}
        >
          <AvatarFallback className="text-[10px]">
            {initials(short.creator.displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p
            className={cn(
              "truncate text-[15px] font-semibold leading-tight",
              overlay ? "text-white" : "text-foreground"
            )}
          >
            {short.creator.displayName}
          </p>
          <p
            className={cn(
              "truncate text-[12px] leading-tight",
              overlay ? "text-white/75" : "text-muted-foreground"
            )}
          >
            {short.churchName}
          </p>
        </div>
      </div>

      {short.caption ?
        <div>
          <p
            className={cn(
              "text-sm leading-snug",
              overlay ? "text-white" : "text-foreground",
              !expanded && "line-clamp-2"
            )}
          >
            {short.caption}
            {short.category ?
              <span className={cn(overlay ? "text-white/70" : "text-muted-foreground")}>
                {` — ${short.category}`}
              </span>
            : null}
          </p>
          {longCaption ?
            <button
              type="button"
              className={cn(
                "mt-1 text-xs font-medium",
                overlay ? "text-white/70 active:text-white" : "text-muted-foreground active:text-foreground"
              )}
              onClick={onToggleExpanded}
            >
              {expanded ? "less" : "more"}
            </button>
          : null}
        </div>
      : null}
    </div>
  );
}

function ShortFeedItemComponent({
  short,
  active,
  liked,
  likeCount,
  commentCount,
  canManage,
  muted,
  onMutedChange,
  onLike,
  onComments,
  getToken,
  onDeleted,
  onCoverUpdated,
  itemRef,
}: ShortFeedItemProps) {
  const [expanded, setExpanded] = React.useState(false);

  if (!short.videoUrl) return null;

  return (
    <article
      ref={itemRef}
      data-short-id={short.id}
      className="h-full snap-start snap-always md:h-auto"
    >
      <div className="relative h-full w-full overflow-hidden bg-black md:hidden">
        <ShortVideoPlayer
          src={short.videoUrl}
          poster={short.thumbnailUrl}
          active={active}
          immersive
          muted={muted}
          onMutedChange={onMutedChange}
          className="absolute inset-0 h-full w-full"
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 via-black/25 to-transparent pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-16">
          <div className="pointer-events-auto max-w-[calc(100%-4.5rem)] px-4">
            <CreatorCaptionBlock
              short={short}
              overlay
              expanded={expanded}
              onToggleExpanded={() => setExpanded((value) => !value)}
            />
          </div>
        </div>

        <div className="absolute bottom-[max(5.25rem,calc(env(safe-area-inset-bottom)+4.25rem))] right-1.5 z-20">
          <ShortActionRail
            short={short}
            liked={liked}
            likeCount={likeCount}
            commentCount={commentCount}
            onLike={onLike}
            onComments={onComments}
            canManage={canManage}
            getToken={getToken}
            onDeleted={onDeleted}
            onCoverUpdated={onCoverUpdated}
            variant="overlay"
          />
        </div>
      </div>

      <div className="hidden min-h-[calc(100dvh-8rem)] items-center justify-center px-4 py-6 md:flex lg:py-8">
        <div className="flex w-full max-w-[420px] flex-col items-center gap-4">
          <div className="flex items-end gap-3">
            <div className="w-[min(calc(100vw-6.5rem),340px)] shrink-0 overflow-hidden rounded-2xl">
              <ShortVideoPlayer
                src={short.videoUrl}
                poster={short.thumbnailUrl}
                active={active}
                muted={muted}
                onMutedChange={onMutedChange}
              />
            </div>

            <div className="shrink-0 pb-2">
              <ShortActionRail
                short={short}
                liked={liked}
                likeCount={likeCount}
                commentCount={commentCount}
                onLike={onLike}
                onComments={onComments}
                canManage={canManage}
                getToken={getToken}
                onDeleted={onDeleted}
                onCoverUpdated={onCoverUpdated}
              />
            </div>
          </div>

          <div className="w-full px-0.5">
            <CreatorCaptionBlock
              short={short}
              expanded={expanded}
              onToggleExpanded={() => setExpanded((value) => !value)}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

export const ShortFeedItem = React.memo(ShortFeedItemComponent);
