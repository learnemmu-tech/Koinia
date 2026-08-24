"use client";

import Link from "next/link";
import { HandHeart, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserPrayerRequests } from "@/hooks/use-user-prayer-requests";
import {
  formatPrayerDate,
  toPrayerRequestPreview,
} from "@/lib/prayer-request-firestore";

function PrayerRequestList({
  requests,
  emptyMessage,
}: {
  requests: ReturnType<typeof useUserPrayerRequests>["requests"];
  emptyMessage: string;
}) {
  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 px-6 py-10 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <Link
          key={request.id}
          href={`/prayer-requests/${encodeURIComponent(request.id)}`}
          className="block rounded-xl border border-border/50 bg-muted/10 p-4 transition-colors hover:bg-muted/30"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="font-medium">{request.title}</p>
            <div className="flex flex-wrap gap-2">
              {request.isAnswered ?
                <Badge className="border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400">
                  Prayer Answered
                </Badge>
              : null}
              <Badge variant="secondary" className="capitalize">
                {request.status}
              </Badge>
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {toPrayerRequestPreview(request.request)}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Submitted {formatPrayerDate(request.createdAt)}
          </p>
        </Link>
      ))}
    </div>
  );
}

export function DashboardPrayerRequestsSection() {
  const { grouped, loading } = useUserPrayerRequests();

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/60">
            Prayer Wall
          </p>
          <h2 className="font-heading text-xl font-bold">My Prayer Requests</h2>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="shrink-0 rounded-full"
        >
          <Link href="/prayer-requests">Submit Request</Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="p-5 sm:p-6">
          {loading ?
            <div className="flex items-center justify-center py-14">
              <Loader2 className="size-5 animate-spin text-primary/60" />
            </div>
          : grouped.all.length === 0 ?
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-6 py-12 text-center">
              <HandHeart className="mx-auto size-7 text-muted-foreground/60" />
              <p className="mt-3 text-sm font-medium">
                No prayer requests yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Share a need with the community and track its review status here.
              </p>
              <Button asChild className="mt-4 rounded-full" size="sm">
                <Link href="/prayer-requests">Submit Prayer Request</Link>
              </Button>
            </div>
          : <Tabs defaultValue="pending" className="space-y-4">
              <TabsList className="grid h-auto w-full max-w-sm grid-cols-2 gap-1 rounded-xl border border-border/50 bg-muted/50 p-1">
                <TabsTrigger
                  value="pending"
                  className="rounded-lg text-xs sm:text-sm"
                >
                  Pending ({grouped.pending.length})
                </TabsTrigger>
                <TabsTrigger
                  value="approved"
                  className="rounded-lg text-xs sm:text-sm"
                >
                  Approved ({grouped.approved.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="mt-0">
                <PrayerRequestList
                  requests={grouped.pending}
                  emptyMessage="No pending prayer requests."
                />
              </TabsContent>

              <TabsContent value="approved" className="mt-0">
                <PrayerRequestList
                  requests={grouped.approved}
                  emptyMessage="No approved prayer requests yet."
                />
              </TabsContent>
            </Tabs>
          }
        </div>
      </div>
    </section>
  );
}
