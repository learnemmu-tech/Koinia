"use client";

import { HeartHandshake, Loader2 } from "lucide-react";

import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";

import { PrayerCardAdminWrapper } from "@/components/prayer/prayer-card-admin-wrapper";
import { SubmitPrayerRequestButton } from "@/components/prayer/submit-prayer-request-button";
import { useAllPrayerRequests } from "@/hooks/use-all-prayer-requests";

type PrayerRequestsAdminClientProps = {
  initialRequests: FirebasePrayerRequest[];
};

export function PrayerRequestsAdminClient({
  initialRequests,
}: PrayerRequestsAdminClientProps) {
  const { requests, loading } = useAllPrayerRequests(initialRequests);

  const pendingCount = requests.filter(
    (request) => request.status === "pending"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <p className="text-sm text-muted-foreground">
            Moderation view · approve, reject, or remove community requests.
          </p>
          {pendingCount > 0 ? (
            <p className="text-xs font-medium text-amber-500">
              {pendingCount} pending{" "}
              {pendingCount === 1 ? "request" : "requests"} awaiting review
            </p>
          ) : null}
        </div>
        <SubmitPrayerRequestButton className="w-full rounded-full sm:w-auto" />
      </div>

      {loading && requests.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : requests.length === 0 ? (
        <div className="overflow-hidden rounded-2xl border border-dashed border-border/60 bg-card/50 shadow-sm">
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <HeartHandshake className="size-8 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium">No prayer requests yet</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
          {requests.map((request) => (
            <PrayerCardAdminWrapper key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  );
}
