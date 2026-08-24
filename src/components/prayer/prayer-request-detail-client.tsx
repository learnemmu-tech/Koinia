"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, Loader2, UserRound } from "lucide-react";

import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";

import {
  PrayerAnsweredBadge,
  PrayerAnsweredButton,
} from "@/components/prayer/prayer-answered-button";
import { PrayerCountStat } from "@/components/prayer/prayer-count-stat";
import { PrayButton } from "@/components/prayer/pray-button";
import { SharePrayerRequestButton } from "@/components/prayer/share-prayer-request-button";
import { usePrayerRequest } from "@/hooks/use-prayer-request";
import {
  formatPrayerDate,
  getPrayerRequestDisplayName,
} from "@/lib/prayer-request-firestore";
import { getPrayerCategoryLabel } from "@/lib/prayer-request-validation";
import { pageDetailClass, typePageTitleClass } from "@/lib/responsive-classes";

type PrayerRequestDetailClientProps = {
  requestId: string;
  initialRequest: FirebasePrayerRequest;
};

export function PrayerRequestDetailClient({
  requestId,
  initialRequest,
}: PrayerRequestDetailClientProps) {
  const { request, loading } = usePrayerRequest(requestId, initialRequest);

  if (loading && !request) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!request || request.status !== "approved") {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          This prayer request is not available.
        </p>
        <Link
          href="/prayer-requests"
          className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
        >
          Back to Prayer Requests
        </Link>
      </div>
    );
  }

  const displayName = getPrayerRequestDisplayName(request);
  const categoryLabel = getPrayerCategoryLabel(request.category);

  return (
    <article className={`${pageDetailClass} space-y-6 pt-2`}>
      <Link
        href="/prayer-requests"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to Prayer Requests
      </Link>

      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="space-y-5 p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  {categoryLabel}
                </span>
                {request.isAnswered ?
                  <PrayerAnsweredBadge />
                : null}
              </div>

              <h1 className={typePageTitleClass}>
                {request.title}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:gap-3 sm:text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <UserRound className="size-3.5" aria-hidden />
                  {displayName}
                </span>
                <span className="hidden text-border sm:inline">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" aria-hidden />
                  {formatPrayerDate(request.createdAt)}
                </span>
                <span className="hidden text-border sm:inline">·</span>
                <PrayerCountStat count={request.prayerCount} />
              </div>
            </div>

            <SharePrayerRequestButton
              requestId={request.id}
              title={request.title}
            />
          </div>

          <div className="border-t border-border/40 pt-5">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 sm:text-base">
              {request.request}
            </p>
          </div>

          <div className="flex flex-col gap-3 border-t border-border/40 pt-5 sm:flex-row sm:flex-wrap sm:items-center">
            <PrayButton
              requestId={request.id}
              initialCount={request.prayerCount}
            />
            <PrayerAnsweredButton request={request} />
          </div>
        </div>
      </div>
    </article>
  );
}
