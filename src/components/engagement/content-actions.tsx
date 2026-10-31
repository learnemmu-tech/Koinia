"use client";

import { FavoriteButton } from "@/components/favorites/favorite-button";
import { LikeButton } from "@/components/engagement/like-button";
import type { FavoriteItemType } from "@/types/firebase-favorite";
import type { LikeItemType } from "@/lib/like-types";
import { cn } from "@/lib/utils";

export function ContentActions({
  likeType,
  itemId,
  saveType,
  layout = "card",
  className,
}: {
  likeType: LikeItemType;
  itemId: string;
  saveType?: FavoriteItemType;
  layout?: "card" | "detail";
  className?: string;
}) {
  if (layout === "detail") {
    return (
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        <LikeButton itemType={likeType} itemId={itemId} appearance="button" />
        {saveType ?
          <FavoriteButton
            itemType={saveType}
            itemId={itemId}
            appearance="button"
          />
        : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "absolute right-2 top-2 z-30 flex items-center gap-0.5 rounded-full border border-border/70 bg-background/95 p-0.5 shadow-sm backdrop-blur-sm pointer-events-auto",
        className
      )}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <LikeButton itemType={likeType} itemId={itemId} appearance="bare" />
      {saveType ?
        <FavoriteButton itemType={saveType} itemId={itemId} appearance="bare" />
      : null}
    </div>
  );
}
