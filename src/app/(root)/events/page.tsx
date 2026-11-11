import type { Metadata } from "next";
import { headers } from "next/headers";

import { CatalogPager } from "@/components/worship/catalog-pager";
import { EventsListClient } from "@/components/events/events-list-client";
import { EventsAdminBar } from "@/components/admin/inline/events-admin-bar";
import { I18nPageHeading } from "@/components/i18n/page-heading";
import { catalogPageQuery, sliceCatalogPage } from "@/lib/content/catalog-page";
import { resolvePageContentQuery } from "@/lib/content/page-content-query";
import { getPublishedEventsCached } from "@/lib/cached-worship-data";
import { splitEventsBySchedule } from "@/lib/event-firestore";
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

export default async function EventsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await (searchParams ?? Promise.resolve<{ page?: string }>({}));
  const { page, offset, limit } = catalogPageQuery(pageParam);
  const { contentQuery, isPlatformPublic } = await resolvePageContentQuery();
  const loaded = await getPublishedEventsCached(contentQuery, limit, offset);
  const { items, hasMore } = sliceCatalogPage(loaded);
  const { upcoming, past } = splitEventsBySchedule(items);
  const signedIn = (await headers()).get("x-koinia-session") === "1";

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
        clientSync={signedIn}
      />
      {signedIn ? null : <CatalogPager page={page} hasMore={hasMore} />}
    </section>
  );
}
