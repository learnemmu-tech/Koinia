"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Loader2 } from "lucide-react";

import type { FirebaseEvent } from "@/types/firebase-event";

import { EventCard } from "@/components/events/event-card";
import { Button } from "@/components/ui/button";
import { usePublishedEvents } from "@/hooks/use-published-events";
import { contentCardGridClassName } from "@/lib/responsive-classes";

type UpcomingEventsSectionClientProps = {
  initialEvents: FirebaseEvent[];
  limit?: number;
};

export function UpcomingEventsSectionClient({
  initialEvents,
  limit = 3,
}: UpcomingEventsSectionClientProps) {
  const { events, loading } = usePublishedEvents(initialEvents, {
    maxItems: limit,
    upcomingOnly: true,
  });

  if (!loading && events.length === 0) return null;

  return (
    <section className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-border/40 bg-card shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <CalendarDays className="size-5 text-primary" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/60">
                Ministry
              </p>
              <h2 className="font-heading text-lg font-bold sm:text-xl">
                Upcoming Events
              </h2>
              <p className="text-xs text-muted-foreground">
                Join us for worship, fellowship, and community gatherings.
              </p>
            </div>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="shrink-0 rounded-full"
          >
            <Link href="/events">
              View All Events
              <ArrowRight className="ml-1.5 size-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {loading && events.length === 0 ?
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-border/50 py-14">
          <Loader2 className="size-5 animate-spin text-primary/60" />
        </div>
      : <div className={contentCardGridClassName}>
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      }
    </section>
  );
}
