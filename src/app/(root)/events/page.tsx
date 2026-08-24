import type { Metadata } from "next";

import { EventsListClient } from "@/components/events/events-list-client";
import { EventsAdminBar } from "@/components/admin/inline/events-admin-bar";
import { getPageTenantContext } from "@/lib/church-page-data";
import { getPublishedEventsGroupedCached } from "@/lib/cached-event-data";
import { pageContentClass, typePageTitleClass } from "@/lib/responsive-classes";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = buildPageMetadata({
  title: "Ministry Events",
  description:
    "Discover upcoming and past ministry events on FaithConnectHub — worship services, fellowship gatherings, and special Christian events.",
  path: "/events",
  keywords: ["Christian events", "church events", "ministry gatherings", "worship services"],
});

export default async function EventsPage() {
  const { scope } = await getPageTenantContext();
  const { upcoming, past } = await getPublishedEventsGroupedCached(scope);

  return (
    <section
      className={pageContentClass}
      aria-labelledby="events-heading"
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/60">
            Ministry
          </p>
          <h1 id="events-heading" className={typePageTitleClass}>
            Events
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Discover upcoming worship services, fellowship gatherings, and special
            ministry events.
          </p>
        </div>
        <EventsAdminBar churchId={scope.churchId ?? ""} />
      </header>

      <EventsListClient initialUpcoming={upcoming} initialPast={past} />
    </section>
  );
}
