import type { Metadata } from "next";
import { headers } from "next/headers";

import { CatalogPager } from "@/components/worship/catalog-pager";
import { SermonsTabContent } from "@/components/worship/sermons-tab-content";
import { SermonsAdminBar } from "@/components/admin/inline/sermons-admin-bar";
import { I18nPageHeading } from "@/components/i18n/page-heading";
import { catalogPageQuery, sliceCatalogPage } from "@/lib/content/catalog-page";
import { resolvePageContentQuery } from "@/lib/content/page-content-query";
import { getPublishedSermonsCached } from "@/lib/cached-worship-data";
import { pageContentClass } from "@/lib/responsive-classes";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = buildPageMetadata({
  title: "Sermons & Biblical Teachings",
  description:
    "Watch and read sermons and biblical teachings on FaithConnectHub. Messages to strengthen faith and deepen your walk with God.",
  path: "/sermons",
  keywords: ["Christian sermons", "biblical teaching", "sermon archive", "faith messages"],
});

export default async function SermonsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await (searchParams ?? Promise.resolve<{ page?: string }>({}));
  const { page, offset, limit } = catalogPageQuery(pageParam);
  const resolveStarted = performance.now();
  const { contentQuery, isPlatformPublic } = await resolvePageContentQuery();
  if (process.env.PERF_TIMING === "1") {
    console.info(
      `[perf] sermons.resolvePageContentQuery: ${Math.round(performance.now() - resolveStarted)}ms`
    );
  }

  const sermonsStarted = performance.now();
  const loaded = await getPublishedSermonsCached(contentQuery, limit, offset);
  const { items: sermons, hasMore } = sliceCatalogPage(loaded);
  const signedIn = (await headers()).get("x-koinia-session") === "1";
  if (process.env.PERF_TIMING === "1") {
    console.info(
      `[perf] sermons.getPublishedSermonsCached: ${Math.round(performance.now() - sermonsStarted)}ms count=${sermons.length}`
    );
  }

  return (
    <section
      className={pageContentClass}
      aria-labelledby="sermons-heading"
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <I18nPageHeading ns="sermons" headingId="sermons-heading" />
        <SermonsAdminBar
          contentScope={isPlatformPublic ? "platform_public" : "organization"}
        />
      </header>

      <SermonsTabContent
        initialSermons={sermons}
        isPlatformPublic={isPlatformPublic}
        clientSync={signedIn}
      />
      {signedIn ? null : <CatalogPager page={page} hasMore={hasMore} />}
    </section>
  );
}
