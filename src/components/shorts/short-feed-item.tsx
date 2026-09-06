"use client";

import React from "react";

import type { VideoShort } from "@/types/video-short";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ShortVideoPlayer } from "@/components/shorts/short-video-player";
import { ShortActionRail } from "@/components/shorts/short-action-rail";
import { parseShortCaption } from "@/lib/short-caption";
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
  attachSrc?: boolean;
  onLike: () => void;
  onComments: () => void;
  getToken: (forceRefresh?: boolean) => Promise<string | null>;
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
  const { title, description, topic } = React.useMemo(
    () => parseShortCaption(short.caption, short.category),
    [short.caption, short.category]
  );
  const canExpand = description.length > 110 || description.includes("\n");

  return (
    <div className={cn("min-w-0 space-y-2 text-left", className)}>
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

      {title || description || topic ?
        <div className="space-y-1.5">
          {title ?
            <h2
              className={cn(
                "text-left text-[15px] font-semibold leading-snug tracking-tight md:text-base",
                overlay ? "text-white" : "text-foreground",
                !expanded && "line-clamp-2"
              )}
            >
              {title}
            </h2>
          : null}

          {description ?
            <p
              className={cn(
                "text-left whitespace-pre-line text-[13px] leading-relaxed md:text-sm",
                overlay ? "text-white/85" : "text-muted-foreground",
                !expanded && "line-clamp-3"
              )}
            >
              {description}
            </p>
          : null}

          {canExpand ?
            <button
              type="button"
              className={cn(
                "text-left text-xs font-medium",
                overlay ?
                  "text-white/70 active:text-white"
                : "text-muted-foreground active:text-foreground"
              )}
              onClick={onToggleExpanded}
            >
              {expanded ? "Less" : "More"}
            </button>
          : null}

          {topic ?
            <p
              className={cn(
                "pt-0.5 text-left text-[11px] font-medium uppercase tracking-wide",
                overlay ? "text-white/60" : "text-muted-foreground/80"
              )}
            >
              {topic}
            </p>
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
  attachSrc = true,
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
      className="h-full snap-start snap-always"
    >
      <div className="relative h-full w-full overflow-hidden bg-black md:hidden">
        <ShortVideoPlayer
          src={short.videoUrl}
          poster={short.thumbnailUrl}
          active={active}
          attachSrc={attachSrc}
          immersive
          muted={muted}
          onMutedChange={onMutedChange}
          className="absolute inset-0 h-full w-full"
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 max-h-[70%] bg-gradient-to-t from-black/70 via-black/25 to-transparent pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-16">
          <div className="pointer-events-auto max-h-[45svh] max-w-[calc(100%-4.5rem)] overflow-y-auto px-4">
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

      <div className="hidden h-full min-h-0 items-center justify-center px-4 py-3 md:flex">
        <div className="flex h-full min-h-0 w-full max-w-[320px] flex-col gap-2.5">
          <div className="flex shrink-0 items-end justify-center gap-3">
            <div className="relative aspect-[9/16] h-[min(420px,calc(100dvh-20rem))] w-auto shrink-0 overflow-hidden rounded-2xl bg-black">
              <ShortVideoPlayer
                src={short.videoUrl}
                poster={short.thumbnailUrl}
                active={active}
                attachSrc={attachSrc}
                immersive
                muted={muted}
                onMutedChange={onMutedChange}
                className="absolute inset-0 h-full w-full"
              />
            </div>

            <div className="shrink-0 pb-1">
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

          <div className="min-h-0 w-full flex-1 overflow-y-auto overscroll-y-contain px-0.5">
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
