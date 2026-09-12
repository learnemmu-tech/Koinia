"use client";

import React from "react";
import { Bookmark, Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { FavoriteItemType } from "@/types/firebase-favorite";

import { useFavoritesOptional } from "@/context/favorites-context";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { cn } from "@/lib/utils";

type FavoriteButtonProps = {
  itemType: FavoriteItemType;
  itemId: string;
  className?: string;
  label?: string;
  /** Icon-only control (cards) vs labeled Save button (detail). */
  appearance?: "icon" | "button";
};

export function FavoriteButton({
  itemType,
  itemId,
  className,
  label,
  appearance = "icon",
}: FavoriteButtonProps) {
  const favorites = useFavoritesOptional();
  const { ensureAuth } = useAuthGuard();
  const [pending, setPending] = React.useState(false);

  if (!favorites) return null;

  const { isFavorited, toggleFavorite } = favorites;
  const favorited = isFavorited(itemType, itemId);
  const ariaLabel =
    label ??
    (favorited ? "Remove from Library" : "Save to Library");
  const buttonText = favorited ? "Saved" : "Save";

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

  if (appearance === "button") {
    return (
      <button
        type="button"
        aria-label={ariaLabel}
        title={ariaLabel}
        aria-pressed={favorited}
        disabled={pending}
        onClick={handleClick}
        className={cn(
          "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-card px-5 text-sm font-semibold text-foreground sm:w-auto sm:min-w-[8.5rem]",
          "transition-colors hover:bg-muted/40",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          favorited && "border-primary/30 text-primary",
          className
        )}
      >
        {pending ?
          <Loader2 className="size-4 animate-spin" aria-hidden />
        : <Bookmark
            className={cn("size-4", favorited && "fill-current")}
            aria-hidden
          />
        }
        {buttonText}
      </button>
    );
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
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        favorited ?
          "text-red-500 hover:text-red-600"
        : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {pending ?
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      : <Heart
          className={cn("size-3.5", favorited && "fill-current")}
          aria-hidden
        />
      }
    </button>
  );
}
