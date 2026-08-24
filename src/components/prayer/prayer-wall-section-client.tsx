"use client";

import Link from "next/link";
import { ArrowRight, HeartHandshake, Loader2 } from "lucide-react";

import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";

import { PrayerWallCard } from "@/components/prayer/prayer-wall-card";
import { Button } from "@/components/ui/button";
import { useApprovedPrayerRequests } from "@/hooks/use-approved-prayer-requests";

type PrayerWallSectionClientProps = {
  initialRequests: FirebasePrayerRequest[];
  limit?: number;
};

export function PrayerWallSectionClient({
  initialRequests,
  limit = 3,
}: PrayerWallSectionClientProps) {
  const { requests, loading } = useApprovedPrayerRequests(
    initialRequests,
    limit
  );

  if (!loading && requests.length === 0) return null;

  return (
    <section className="space-y-5">
      {/* ── Section header ── */}
      <div className="overflow-hidden rounded-2xl border border-border/40 bg-card shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <HeartHandshake className="size-5 text-primary" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/60">
                Community
              </p>
              <h2 className="font-heading text-lg font-bold sm:text-xl">
                Prayer Wall
              </h2>
              <p className="text-xs text-muted-foreground">
                Join our community in prayer for these recent requests.
              </p>
            </div>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="shrink-0 rounded-full"
          >
            <Link href="/prayer-requests">
              View All
              <ArrowRight className="ml-1.5 size-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Cards ── */}
      {loading && requests.length === 0 ? (
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-border/50 py-14">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="size-5 animate-spin text-primary/60" />
            <p className="text-xs text-muted-foreground">
              Loading prayer requests…
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
          {requests.map((request) => (
            <PrayerWallCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </section>
  );
}