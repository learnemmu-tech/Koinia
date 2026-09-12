"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import type { FirebaseEvent } from "@/types/firebase-event";

import { EventCard } from "@/components/events/event-card";
import { ContentAreaLoading } from "@/components/content-area-loading";
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
type EventsListClientProps = {
  initialUpcoming: FirebaseEvent[];
  initialPast: FirebaseEvent[];
  isPlatformPublic?: boolean;
};

function matchesSearch(event: FirebaseEvent, query: string): boolean {
  if (!query) return true;
  return event.title.toLowerCase().includes(query);
}

export function EventsListClient({
  initialUpcoming,
  initialPast,
  isPlatformPublic = false,
}: EventsListClientProps) {
  const t = useTranslations("events");
  const initialCombined = useMemo(
    () => [...initialUpcoming, ...initialPast],
    [initialUpcoming, initialPast]
  );
  const { grouped, loading, loadMore, hasMore, loadingMore } =
    usePublishedEvents(initialCombined, { clientSync: !isPlatformPublic });
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

  if (!isPlatformPublic && tenantScope.blocked) {
    return <WorkspaceChurchRequiredNotice />;
  }

  if (loading && upcoming.length === 0 && past.length === 0) {
    return <ContentAreaLoading />;
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
        searchPlaceholder={t("searchPlaceholder")}
      >
        <Select value={scheduleFilter} onValueChange={setScheduleFilter}>
          <SelectTrigger className="w-full min-w-0 sm:w-[10rem] rounded-full">
            <SelectValue placeholder={t("schedule")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allEvents")}</SelectItem>
            <SelectItem value="upcoming">{t("upcoming")}</SelectItem>
            <SelectItem value="past">{t("past")}</SelectItem>
          </SelectContent>
        </Select>
      </ContentListToolbar>

      {noResults ?
        <div className="rounded-2xl border border-dashed border-border/50 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {t("noMatch")}
          </p>
        </div>
      : <div className="space-y-10">
          {showUpcoming ?
            <EventsSection
              title={t("upcomingTitle")}
              events={filteredUpcoming}
              emptyMessage={t("noUpcoming")}
            />
          : null}
          {showPast ?
            <EventsSection
              title={t("pastTitle")}
              events={filteredPast}
              emptyMessage={t("noPast")}
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
      : <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      }
    </section>
  );
}
