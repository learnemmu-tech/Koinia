"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";

import { Button } from "@/components/ui/button";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { usePrayerIntercession } from "@/hooks/use-prayer-intercession";
import { recordPrayerIntercession } from "@/lib/prayer-request-mutations";
import { cn } from "@/lib/utils";

type PrayButtonProps = {
  requestId: string;
  initialCount: number;
  className?: string;
  compact?: boolean;
  /** @deprecated Use appearance="feed" instead */
  showCountInLabel?: boolean;
  /** Visual style for prayer wall cards */
  appearance?: "default" | "feed" | "feed-card" | "wall";
};

export function PrayButton({
  requestId,
  initialCount,
  className,
  compact = false,
  showCountInLabel = false,
  appearance = "default",
}: PrayButtonProps) {
  const { authUser } = useFirebaseAuth();
  const queryClient = useQueryClient();
  const { ensureAuth } = useAuthGuard();
  const { hasPrayed, loading: intercessionLoading } = usePrayerIntercession(
    requestId,
    authUser?.uid
  );
  const [count, setCount] = useState(initialCount);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  async function handlePray() {
    if (hasPrayed || submitting || intercessionLoading) return;
    if (!ensureAuth()) return;
    if (!authUser?.uid) return;

    setSubmitting(true);
    try {
      await recordPrayerIntercession(requestId, authUser.uid);
      queryClient.setQueryData(
        ["prayer-intercession", requestId, authUser.uid],
        true
      );
      setCount((current) => current + 1);
      toast.success("Thank you for praying");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to record your prayer";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  const isDisabled = hasPrayed || submitting || intercessionLoading;
  const isFeed = appearance === "feed";
  const isFeedCard = appearance === "feed-card";
  const isWall = appearance === "wall";
  const displayCount = count > 99 ? "99+" : String(count);

  const feedLabel =
    hasPrayed ?
      count > 0 ?
        `🙏 Prayed • ${displayCount}`
      : "🙏 Prayed"
    : count > 0 ?
      `🙏 Pray • ${displayCount}`
    : "🙏 Pray";

  const feedCardCountLabel =
    count === 1 ? "1 person prayed" : `${displayCount} people prayed`;

  const defaultCountLabel =
    showCountInLabel && count > 0 ? ` (${displayCount})` : "";

  if (isWall) {
    const countLabel =
      count > 0 ?
        `${displayCount} praying`
      : "Be the first to pray";

    return (
      <div className={cn("flex shrink-0 items-center gap-2.5", className)}>
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          {countLabel}
        </span>
        <Button
          type="button"
          size="sm"
          variant={hasPrayed ? "secondary" : "default"}
          disabled={isDisabled}
          onClick={handlePray}
          aria-pressed={hasPrayed}
          aria-label={
            hasPrayed ?
              "You have prayed for this request"
            : "Pray for this request"
          }
          className={cn(
            "h-8 shrink-0 rounded-full px-3.5 text-[13px] font-medium shadow-none",
            "transition-all duration-200 ease-out active:scale-[0.98]",
            hasPrayed ?
              "border-green-500/30 bg-green-600 text-white hover:bg-green-600/90"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {submitting ?
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          : hasPrayed ?
            "Prayed ✓"
          : "🙏 Pray"}
        </Button>
      </div>
    );
  }

  if (isFeedCard) {
    return (
      <div className={cn("flex items-center justify-between gap-3", className)}>
        <p className="min-w-0 text-sm text-muted-foreground">
          <span aria-hidden className="mr-1">
            🙏
          </span>
          {feedCardCountLabel}
        </p>
        <Button
          type="button"
          size="sm"
          variant={hasPrayed ? "secondary" : "outline"}
          disabled={isDisabled}
          onClick={handlePray}
          aria-pressed={hasPrayed}
          aria-label={
            hasPrayed ?
              "You have prayed for this request"
            : "Pray for this request"
          }
          className={cn(
            "h-8 shrink-0 rounded-full px-3.5 text-xs font-medium shadow-none",
            "transition-all duration-200 ease-out hover:bg-accent active:scale-[0.98]",
            hasPrayed &&
              "border-primary/20 bg-primary/10 text-primary hover:bg-primary/15"
          )}
        >
          {submitting ?
            <Loader2 className="mr-1.5 size-3.5 animate-spin" aria-hidden />
          : hasPrayed ?
            <>
              <Check className="mr-1 size-3.5" aria-hidden />
              Prayed
            </>
          : "🙏 I Prayed"}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        type="button"
        size={isFeed || compact ? "sm" : "default"}
        variant={hasPrayed ? "secondary" : "outline"}
        disabled={isDisabled}
        onClick={handlePray}
        aria-pressed={hasPrayed}
        aria-label={
          hasPrayed ?
            "You have prayed for this request"
          : "Pray for this request"
        }
        className={cn(
          "font-medium transition-all duration-200 ease-out",
          isFeed ?
            cn(
              "h-7 rounded-full px-3 text-[11px] shadow-none",
              "hover:bg-accent active:scale-[0.98]",
              hasPrayed &&
                "border-border/60 bg-muted/50 text-foreground hover:bg-muted/70"
            )
          : cn(
              "rounded-full",
              hasPrayed &&
                "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
            )
        )}
      >
        {submitting && !isFeed ?
          <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden />
        : hasPrayed && !isFeed ?
          <Check className="mr-1.5 size-4" aria-hidden />
        : null}
        {submitting && isFeed ?
          <Loader2 className="mr-1.5 size-3.5 animate-spin" aria-hidden />
        : null}
        {isFeed ?
          feedLabel
        : hasPrayed ?
          `✔ You Prayed${defaultCountLabel}`
        : `🙏 I Prayed${defaultCountLabel}`}
      </Button>
      {!compact && !showCountInLabel ?
        <span className="text-xs tabular-nums text-muted-foreground">
          {count.toLocaleString()} {count === 1 ? "prayer" : "prayers"}
        </span>
      : null}
    </div>
  );
}

export function PrayButtonStatic({
  request,
  className,
  compact,
}: {
  request: FirebasePrayerRequest;
  className?: string;
  compact?: boolean;
}) {
  return (
    <PrayButton
      requestId={request.id}
      initialCount={request.prayerCount}
      className={className}
      compact={compact}
    />
  );
}
