"use client";

import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";

import { PrayerWallCard } from "@/components/prayer/prayer-wall-card";
import { PrayerModerationBar } from "@/components/prayer/prayer-moderation-bar";

export function PrayerCardAdminWrapper({
  request,
}: {
  request: FirebasePrayerRequest;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card">
      <PrayerWallCard
        request={request}
        className="rounded-none border-0 bg-transparent"
      />
      <PrayerModerationBar request={request} />
    </div>
  );
}
