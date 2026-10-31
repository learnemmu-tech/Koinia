"use client";

import React from "react";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAuthGuard } from "@/hooks/use-auth-guard";
import { getLikeSummary, toggleContentLike } from "@/lib/like-actions";
import type { LikeItemType } from "@/lib/like-types";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type LikeState = { count: number; liked: boolean };

const cache = new Map<string, LikeState>();
const listeners = new Map<string, Set<(state: LikeState) => void>>();
const queued = new Map<string, { itemType: LikeItemType; itemId: string }>();
let flushTimer: number | null = null;

function keyOf(itemType: string, itemId: string) {
  return `${itemType}:${itemId}`;
}

function publish(key: string, state: LikeState) {
  cache.set(key, state);
  listeners.get(key)?.forEach((listener) => listener(state));
}

function scheduleFlush() {
  if (flushTimer !== null || queued.size === 0) return;
  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    const items = [...queued.values()];
    queued.clear();
    if (items.length === 0) return;
    void getLikeSummary(items)
      .then((summary) => {
        for (const item of items) {
          const key = keyOf(item.itemType, item.itemId);
          publish(key, summary[key] ?? { count: 0, liked: false });
        }
      })
      .catch(() => undefined);
  }, 0);
}

function useLikeState(itemType: LikeItemType, itemId: string) {
  const key = keyOf(itemType, itemId);
  const [state, setState] = React.useState<LikeState>(
    () => cache.get(key) ?? { count: 0, liked: false }
  );
  const [ready, setReady] = React.useState(cache.has(key));

  React.useEffect(() => {
    const listener = (next: LikeState) => {
      setState(next);
      setReady(true);
    };
    const set = listeners.get(key) ?? new Set();
    set.add(listener);
    listeners.set(key, set);
    if (!cache.has(key)) {
      queued.set(key, { itemType, itemId });
      scheduleFlush();
    } else {
      setReady(true);
    }
    return () => {
      set.delete(listener);
    };
  }, [itemId, itemType, key]);

  return { state, ready, key };
}

export function LikeButton({
  itemType,
  itemId,
  appearance = "icon",
  className,
}: {
  itemType: LikeItemType;
  itemId: string;
  appearance?: "icon" | "bare" | "button";
  className?: string;
}) {
  const { ensureAuth } = useAuthGuard();
  const { state, ready, key } = useLikeState(itemType, itemId);
  const [pending, setPending] = React.useState(false);

  async function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!ensureAuth()) return;
    if (pending) return;
    const previous = cache.get(key) ?? state;
    const optimistic = {
      liked: !previous.liked,
      count: Math.max(0, previous.count + (previous.liked ? -1 : 1)),
    };
    publish(key, optimistic);
    setPending(true);
    try {
      const next = await toggleContentLike(itemType, itemId);
      publish(key, next);
    } catch (error) {
      publish(key, previous);
      toast.error(error instanceof Error ? error.message : "Could not update like");
    } finally {
      setPending(false);
    }
  }

  const label = state.liked ? "Unlike" : "Like";
  const countLabel = ready ? String(state.count) : "–";
  const ariaLabel = `${label} this ${itemType}`;

  const control = (
    <button
      type="button"
      onClick={(event) => void handleClick(event)}
      aria-pressed={state.liked}
      aria-label={ariaLabel}
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-1 text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        appearance === "button" &&
          "h-9 rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground",
        appearance === "icon" &&
          "h-8 rounded-full border border-border/70 bg-background/95 px-2 text-xs shadow-sm backdrop-blur-sm",
        appearance === "bare" && "h-7 rounded-full px-1.5 text-xs",
        className
      )}
    >
      {pending ?
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      : <Heart
          className={cn(
            "size-3.5 transition-colors duration-150",
            state.liked && "fill-[#EF4444] text-[#EF4444]"
          )}
          aria-hidden
        />}
      {appearance === "button" ? <span>Like</span> : null}
      <span>{countLabel}</span>
    </button>
  );

  if (appearance === "button") return control;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{control}</TooltipTrigger>
      <TooltipContent side="bottom" align="end">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
