"use client";

import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";

import { ProtectedContentLink } from "@/components/auth/protected-content-link";
import { PrayButton } from "@/components/prayer/pray-button";
import {
  getPrayerRequestDisplayName,
} from "@/lib/prayer-request-firestore";
import { getPrayerCategoryLabel } from "@/lib/prayer-request-validation";

type HomePrayerCardProps = {
  request: FirebasePrayerRequest;
};

export function HomePrayerCard({ request }: HomePrayerCardProps) {
  const href = `/prayer-requests/${encodeURIComponent(request.id)}`;
  const displayName = getPrayerRequestDisplayName(request);
  const excerpt = request.request.replace(/\s+/g, " ").trim();

  return (
    <article className="flex h-full flex-col rounded-xl border border-border/50 bg-card/40 p-3.5 transition-colors duration-200 hover:border-border/80 hover:bg-card/60">
      <ProtectedContentLink
        href={href}
        className="min-w-0 flex-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
          {getPrayerCategoryLabel(request.category)}
        </p>
        <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-white">
          {request.title}
        </h3>
        {excerpt ?
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#A1A1A1]">
            {excerpt}
          </p>
        : null}
        <p className="mt-2 text-xs text-[#6B7280]">{displayName}</p>
      </ProtectedContentLink>

      <div
        className="mt-3 border-t border-border/40 pt-2.5"
        onClick={(event) => event.stopPropagation()}
      >
        <PrayButton
          requestId={request.id}
          initialCount={request.prayerCount}
          appearance="feed"
          compact
        />
      </div>
    </article>
  );
}
