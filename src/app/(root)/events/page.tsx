import type { Metadata } from "next";

import { EventsListClient } from "@/components/events/events-list-client";
import { EventsAdminBar } from "@/components/admin/inline/events-admin-bar";
import { I18nPageHeading } from "@/components/i18n/page-heading";
import { resolvePageContentQuery } from "@/lib/content/page-content-query";
import { getPublishedEventsGroupedCached } from "@/lib/cached-event-data";
import { pageContentClass } from "@/lib/responsive-classes";
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
  const { contentQuery, isPlatformPublic } = await resolvePageContentQuery();
  const { upcoming, past } = await getPublishedEventsGroupedCached(contentQuery);

  return (
    <section
      className={pageContentClass}
      aria-labelledby="events-heading"
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <I18nPageHeading ns="events" headingId="events-heading" />
        <EventsAdminBar
          contentScope={isPlatformPublic ? "platform_public" : "organization"}
        />
      </header>

      <EventsListClient
        initialUpcoming={upcoming}
        initialPast={past}
        isPlatformPublic={isPlatformPublic}
      />
    </section>
  );
}
