"use client";

import React from "react";
import { Bookmark, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useTranslations } from "next-intl";

import type { FavoriteItemType } from "@/types/firebase-favorite";

import { useFavoritesOptional } from "@/context/favorites-context";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type FavoriteButtonProps = {
  itemType: FavoriteItemType;
  itemId: string;
  className?: string;
  label?: string;
  /** Icon-only control (cards) vs labeled Save button (detail). */
  appearance?: "icon" | "bare" | "button";
};

export function FavoriteButton({
  itemType,
  itemId,
  className,
  label,
  appearance = "icon",
}: FavoriteButtonProps) {
  const t = useTranslations("library");
  const tCommon = useTranslations("common");
  const favorites = useFavoritesOptional();
  const { ensureAuth } = useAuthGuard();
  const [pending, setPending] = React.useState(false);

  if (!favorites) return null;

  const { isFavorited, toggleFavorite } = favorites;
  const favorited = isFavorited(itemType, itemId);
  const ariaLabel =
    label ??
    (favorited ? t("removeFromLibrary") : t("saveToLibrary"));
  const buttonText = tCommon("save");

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
        wasFavorited ? t("removedFromLibrary") : t("savedToLibrary")
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
          "inline-flex h-9 w-auto items-center justify-center gap-1.5 rounded-xl border border-border/70 bg-card px-3 text-sm font-medium text-foreground",
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

  const icon = (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={favorited}
      disabled={pending}
      onClick={handleClick}
      className={cn(
        "flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        favorited && "text-foreground",
        appearance === "icon" &&
          "size-8 border border-border/50 bg-background/85 shadow-sm backdrop-blur-sm",
        appearance === "bare" && "size-7",
        className
      )}
    >
      {pending ?
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      : <Bookmark
          className={cn("size-3.5", favorited && "fill-current")}
          aria-hidden
        />
      }
    </button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{icon}</TooltipTrigger>
      <TooltipContent side="bottom" align="end">
        {ariaLabel}
      </TooltipContent>
    </Tooltip>
  );
}
