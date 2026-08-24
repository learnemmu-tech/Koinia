"use client";

import React from "react";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { FavoriteItemType } from "@/types/firebase-favorite";

import { useFavorites } from "@/context/favorites-context";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { cn } from "@/lib/utils";

type FavoriteButtonProps = {
  itemType: FavoriteItemType;
  itemId: string;
  className?: string;
  label?: string;
};

export function FavoriteButton({
  itemType,
  itemId,
  className,
  label,
}: FavoriteButtonProps) {
  const { isFavorited, toggleFavorite } = useFavorites();
  const { ensureAuth } = useAuthGuard();
  const [pending, setPending] = React.useState(false);

  const favorited = isFavorited(itemType, itemId);
  const ariaLabel =
    label ??
    (favorited ? "Remove from Library" : "Save to Library");

  async function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (pending) return;
    if (!ensureAuth()) return;

    setPending(true);
    try {
      const wasFavorited = favorited;
      await toggleFavorite(itemType, itemId);
      toast.success(
        wasFavorited ? "Removed from Library" : "Saved to Library"
      );
    } catch {
      toast.error("Unable to update your library. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={ariaLabel}
      aria-pressed={favorited}
      disabled={pending}
      onClick={handleClick}
      className={cn(
        "flex size-8 items-center justify-center rounded-full",
        "border border-border/50 bg-background/85 shadow-sm backdrop-blur-sm",
        "transition-colors hover:bg-background",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        favorited ?
          "text-red-500 hover:text-red-600"
        : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {pending ?
        <Loader2 className="size-4 animate-spin" aria-hidden />
      : <Heart
          className={cn("size-4", favorited && "fill-current")}
          aria-hidden
        />
      }
    </button>
  );
}
