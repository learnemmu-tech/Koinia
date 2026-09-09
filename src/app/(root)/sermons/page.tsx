import type { Metadata } from "next";

import { SermonsTabContent } from "@/components/worship/sermons-tab-content";
import { SermonsAdminBar } from "@/components/admin/inline/sermons-admin-bar";
import { I18nPageHeading } from "@/components/i18n/page-heading";
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

export default async function SermonsPage() {
  const { contentQuery, isPlatformPublic } = await resolvePageContentQuery();
  const sermons = await getPublishedSermonsCached(contentQuery);

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
      />
    </section>
  );
}
