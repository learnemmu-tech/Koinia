"use client";

import React from "react";

import type { VideoShort } from "@/types/video-short";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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

function ShortFeedItemComponent({
  short,
  active,
  liked,
  likeCount,
  commentCount,
  canManage,
  onLike,
  onComments,
  getToken,
  onDeleted,
  onCoverUpdated,
  itemRef,
}: ShortFeedItemProps) {
  const [expanded, setExpanded] = React.useState(false);
  const longCaption = short.caption.length > 120;

  if (!short.videoUrl) return null;

  return (
    <article
      ref={itemRef}
      data-short-id={short.id}
      className="flex min-h-[calc(100dvh-5.5rem)] snap-start snap-always items-center justify-center px-3 py-4"
    >
      <div className="flex w-full max-w-[min(100%,380px)] flex-col items-center gap-3">
        <div className="flex items-end gap-2.5 sm:gap-3">
          <div className="w-[min(calc(100vw-5.5rem),320px)] shrink-0">
            <ShortVideoPlayer
              src={short.videoUrl}
              poster={short.thumbnailUrl}
              active={active}
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

        <div className="w-full space-y-2 px-0.5">
          <div className="flex items-center gap-2">
            <Avatar className="size-8 shrink-0">
              <AvatarFallback className="text-[10px]">
                {initials(short.creator.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {short.creator.displayName}
              </p>
              <p className="truncate text-xs text-muted-foreground">{short.churchName}</p>
            </div>
            <Badge variant="secondary" className="ml-auto shrink-0 text-[10px]">
              {short.category}
            </Badge>
          </div>

          {short.caption ?
            <div>
              <p
                className={cn(
                  "text-sm leading-relaxed text-foreground",
                  !expanded && longCaption && "line-clamp-2"
                )}
              >
                {short.caption}
              </p>
              {longCaption ?
                <button
                  type="button"
                  className="mt-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setExpanded((value) => !value)}
                >
                  {expanded ? "less" : "more"}
                </button>
              : null}
            </div>
          : null}
        </div>
      </div>
    </article>
  );
}

export const ShortFeedItem = React.memo(ShortFeedItemComponent);
