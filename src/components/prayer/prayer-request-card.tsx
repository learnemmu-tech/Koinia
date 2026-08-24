"use client";

import { useEffect, useState } from "react";

import type {
  FirebasePrayerRequest,
  PrayerRequestCategory,
} from "@/types/firebase-prayer-request";

import { ProtectedContentLink } from "@/components/auth/protected-content-link";
import { PrayerAnsweredBadge } from "@/components/prayer/prayer-answered-button";
import { PrayButton } from "@/components/prayer/pray-button";
import {
  formatPrayerDate,
  getPrayerRequestDisplayName,
} from "@/lib/prayer-request-firestore";
import { getPrayerCategoryLabel } from "@/lib/prayer-request-validation";
import { cn } from "@/lib/utils";

type PrayerRequestCardProps = {
  request: FirebasePrayerRequest;
  compact?: boolean;
  showPrayButton?: boolean;
  className?: string;
  linkToDetail?: boolean;
};

const categoryStyles: Record<PrayerRequestCategory, string> = {
  general: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
  health: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  family: "bg-sky-500/10 text-sky-800 dark:text-sky-300",
  finances: "bg-amber-500/10 text-amber-800 dark:text-amber-300",
  salvation: "bg-violet-500/10 text-violet-800 dark:text-violet-300",
  guidance: "bg-indigo-500/10 text-indigo-800 dark:text-indigo-300",
  thanksgiving: "bg-orange-500/10 text-orange-800 dark:text-orange-300",
  other: "bg-muted text-muted-foreground",
};

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return formatPrayerDate(timestamp);
}

function AuthorAvatar({ initials }: { initials: string }) {
  return (
    <div
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
      aria-hidden
    >
      {initials}
    </div>
  );
}

export function PrayerRequestCard({
  request,
  compact = false,
  showPrayButton = true,
  className,
  linkToDetail = true,
}: PrayerRequestCardProps) {
  const displayName = getPrayerRequestDisplayName(request);
  const detailHref = `/prayer-requests/${encodeURIComponent(request.id)}`;
  const categoryLabel = getPrayerCategoryLabel(request.category);
  const category = request.category ?? "general";

  const initials =
    displayName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "A";

  const [postedLabel, setPostedLabel] = useState(() =>
    formatPrayerDate(request.createdAt)
  );

  useEffect(() => {
    setPostedLabel(formatRelativeTime(request.createdAt));
  }, [request.createdAt]);

  const contentBlock = (
    <div className="min-w-0 space-y-3">
      {request.isAnswered ?
        <PrayerAnsweredBadge className="text-[11px]" />
      : null}

      <h3
        className={cn(
          "font-semibold leading-snug text-foreground",
          compact ? "text-base" : "text-base sm:text-lg"
        )}
      >
        {request.title}
      </h3>

      <p
        className={cn(
          "text-sm leading-[1.6] text-muted-foreground",
          compact ? "line-clamp-3" : "line-clamp-4"
        )}
      >
        {request.request.replace(/\s+/g, " ").trim()}
      </p>
    </div>
  );

  return (
    <article
      className={cn(
        "mx-auto w-full max-w-[680px] rounded-2xl border border-border/50 bg-card shadow-sm",
        "transition-shadow duration-200 hover:shadow-md",
        className
      )}
    >
      <div className="p-4 sm:p-6">
        {/* Header */}
        <header className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <AuthorAvatar initials={initials} />
            <div className="min-w-0 pt-0.5">
              <p className="truncate text-sm font-semibold text-foreground">
                {displayName}
              </p>
              <time
                className="mt-0.5 block text-xs text-muted-foreground"
                dateTime={new Date(request.createdAt).toISOString()}
              >
                {postedLabel}
              </time>
            </div>
          </div>

          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium leading-none",
              categoryStyles[category]
            )}
          >
            {categoryLabel}
          </span>
        </header>

        {/* Content */}
        <div className="mt-4">
          {linkToDetail ?
            <ProtectedContentLink
              href={detailHref}
              className="block min-w-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              {contentBlock}
            </ProtectedContentLink>
          : contentBlock}
        </div>

        {/* Actions */}
        {showPrayButton ?
          <div
            className="mt-5 border-t border-border/40 pt-4"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.preventDefault()}
          >
            <PrayButton
              requestId={request.id}
              initialCount={request.prayerCount}
              appearance="feed-card"
            />
          </div>
        : null}
      </div>
    </article>
  );
}

export function PrayerRequestCardSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-[680px] rounded-2xl border border-border/50 bg-card p-4 sm:p-6"
      aria-hidden
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="size-9 animate-pulse rounded-full bg-muted" />
          <div className="space-y-2 pt-0.5">
            <div className="h-3.5 w-24 animate-pulse rounded bg-muted" />
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
        <div className="h-3.5 w-full animate-pulse rounded bg-muted" />
        <div className="h-3.5 w-11/12 animate-pulse rounded bg-muted" />
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-4">
        <div className="h-3.5 w-28 animate-pulse rounded bg-muted" />
        <div className="h-7 w-[5.75rem] animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}
