"use client";

import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";

import { ProtectedContentLink } from "@/components/auth/protected-content-link";
import { PrayerAnsweredBadge } from "@/components/prayer/prayer-answered-button";
import { PrayButton } from "@/components/prayer/pray-button";
import {
  formatPrayerDate,
  getPrayerRequestDisplayName,
} from "@/lib/prayer-request-firestore";
import { getPrayerCategoryLabel } from "@/lib/prayer-request-validation";
import { cn } from "@/lib/utils";

type PrayerWallCardProps = {
  request: FirebasePrayerRequest;
  className?: string;
  linkToDetail?: boolean;
};

function AuthorAvatar({ initials }: { initials: string }) {
  return (
    <div
      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary"
      aria-hidden
    >
      {initials}
    </div>
  );
}

export function PrayerWallCard({
  request,
  className,
  linkToDetail = true,
}: PrayerWallCardProps) {
  const displayName = getPrayerRequestDisplayName(request);
  const detailHref = `/prayer-requests/${encodeURIComponent(request.id)}`;
  const categoryLabel = getPrayerCategoryLabel(request.category);
  const dateLabel = formatPrayerDate(request.createdAt);

  const initials =
    displayName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "A";

  const contentBlock = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
          {categoryLabel}
        </span>
        <time
          className="shrink-0 text-xs text-muted-foreground"
          dateTime={new Date(request.createdAt).toISOString()}
        >
          {dateLabel}
        </time>
      </div>

      {request.isAnswered ?
        <div className="mt-3">
          <PrayerAnsweredBadge className="text-[10px]" />
        </div>
      : null}

      <h3
        className={cn(
          "mt-3 line-clamp-2 text-base font-bold leading-snug text-foreground",
          request.isAnswered && "mt-2"
        )}
      >
        {request.title}
      </h3>

      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground/70">
        {request.request.replace(/\s+/g, " ").trim()}
      </p>
    </>
  );

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-2xl border border-white/[0.08] bg-card p-5",
        "transition-all duration-200 ease-out",
        "hover:-translate-y-0.5 hover:border-white/15 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]",
        className
      )}
    >
      {linkToDetail ?
        <ProtectedContentLink
          href={detailHref}
          className="block min-w-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        >
          {contentBlock}
        </ProtectedContentLink>
      : contentBlock}

      <div className="my-3 h-px bg-white/[0.08]" aria-hidden />

      <div
        className="mt-auto flex items-center justify-between gap-3"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.preventDefault()}
      >
        <div className="flex min-w-0 items-center gap-2">
          <AuthorAvatar initials={initials} />
          <p className="truncate text-[13px] text-muted-foreground">
            {displayName}
          </p>
        </div>

        <PrayButton
          requestId={request.id}
          initialCount={request.prayerCount}
          appearance="wall"
        />
      </div>
    </article>
  );
}

export function PrayerWallCardSkeleton() {
  return (
    <div
      className="flex h-full flex-col rounded-2xl border border-white/[0.08] bg-card p-5"
      aria-hidden
    >
      <div className="flex items-center justify-between gap-2">
        <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
        <div className="h-3 w-16 animate-pulse rounded bg-muted" />
      </div>
      <div className="mt-3 h-5 w-4/5 animate-pulse rounded bg-muted" />
      <div className="mt-2 space-y-1.5">
        <div className="h-3.5 w-full animate-pulse rounded bg-muted" />
        <div className="h-3.5 w-10/12 animate-pulse rounded bg-muted" />
      </div>
      <div className="my-3 h-px bg-white/[0.08]" />
      <div className="mt-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="size-7 animate-pulse rounded-full bg-muted" />
          <div className="h-3.5 w-20 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-8 w-24 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}
