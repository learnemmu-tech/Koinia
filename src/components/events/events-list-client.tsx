"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import type { FirebaseEvent } from "@/types/firebase-event";

import { EventCard } from "@/components/events/event-card";
import { ContentListToolbar } from "@/components/worship/content-list-toolbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContentLoadMore } from "@/components/ui/content-load-more";
import { WorkspaceChurchRequiredNotice } from "@/components/workspace/workspace-church-required-notice";
import { usePublishedEvents } from "@/hooks/use-published-events";
import { useContentTenantScope } from "@/hooks/use-workspace-tenant-scope";
import { contentCardGridClassName } from "@/lib/responsive-classes";

type EventsListClientProps = {
  initialUpcoming: FirebaseEvent[];
  initialPast: FirebaseEvent[];
};

function matchesSearch(event: FirebaseEvent, query: string): boolean {
  if (!query) return true;
  return event.title.toLowerCase().includes(query);
}

export function EventsListClient({
  initialUpcoming,
  initialPast,
}: EventsListClientProps) {
  const initialCombined = useMemo(
    () => [...initialUpcoming, ...initialPast],
    [initialUpcoming, initialPast]
  );
  const { grouped, loading, loadMore, hasMore, loadingMore } =
    usePublishedEvents(initialCombined);
  const tenantScope = useContentTenantScope();
  const { upcoming, past } = grouped;

  const [search, setSearch] = useState("");
  const [scheduleFilter, setScheduleFilter] = useState<string>("all");

  const query = search.trim().toLowerCase();

  const filteredUpcoming = useMemo(
    () => upcoming.filter((event) => matchesSearch(event, query)),
    [upcoming, query]
  );
  const filteredPast = useMemo(
    () => past.filter((event) => matchesSearch(event, query)),
    [past, query]
  );

  if (tenantScope.blocked) {
    return <WorkspaceChurchRequiredNotice />;
  }

  if (loading && upcoming.length === 0 && past.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-dashed border-border/50 py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const showUpcoming = scheduleFilter === "all" || scheduleFilter === "upcoming";
  const showPast = scheduleFilter === "all" || scheduleFilter === "past";
  const noResults =
    (showUpcoming ? filteredUpcoming.length : 0) +
      (showPast ? filteredPast.length : 0) ===
    0;

  return (
    <div className="space-y-6">
      <ContentListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search events…"
      >
        <Select value={scheduleFilter} onValueChange={setScheduleFilter}>
          <SelectTrigger className="w-full min-w-0 sm:w-[10rem] rounded-full">
            <SelectValue placeholder="Schedule" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All events</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="past">Past</SelectItem>
          </SelectContent>
        </Select>
      </ContentListToolbar>

      {noResults ?
        <div className="rounded-2xl border border-dashed border-border/50 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No events match your search.
          </p>
        </div>
      : <div className="space-y-10">
          {showUpcoming ?
            <EventsSection
              title="Upcoming Events"
              events={filteredUpcoming}
              emptyMessage="No upcoming events scheduled right now."
            />
          : null}
          {showPast ?
            <EventsSection
              title="Past Events"
              events={filteredPast}
              emptyMessage="No past events to show yet."
            />
          : null}
        </div>
      }

      <ContentLoadMore
        hasMore={hasMore}
        loading={loadingMore}
        onLoadMore={loadMore}
      />
    </div>
  );
}

function EventsSection({
  title,
  events,
  emptyMessage,
}: {
  title: string;
  events: FirebaseEvent[];
  emptyMessage: string;
}) {
  return (
    <section className="space-y-4">
      <h2 className="font-heading text-lg font-bold sm:text-xl">{title}</h2>
      {events.length === 0 ?
        <div className="rounded-2xl border border-dashed border-border/50 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
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
