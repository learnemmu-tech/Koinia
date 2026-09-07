import type { Metadata } from "next";

import { PrayerRequestsListClient } from "@/components/prayer/prayer-requests-list-client";
import { getApprovedPrayerRequestsCached } from "@/lib/cached-prayer-data";
import { resolvePageContentQuery } from "@/lib/content/page-content-query";
import { pageContentClass } from "@/lib/responsive-classes";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = buildPageMetadata({
  title: "Prayer Wall",
  description:
    "Lift each other up in prayer. Share prayer needs with your church community on FaithConnectHub.",
  path: "/prayer-requests",
  keywords: ["prayer wall", "prayer requests", "Christian prayer", "intercession"],
});

export default async function PrayerRequestsPage() {
  const { contentQuery } = await resolvePageContentQuery({ tenantOnly: true });
  const requests = await getApprovedPrayerRequestsCached(contentQuery);

  return (
    <section
      className={pageContentClass}
      aria-labelledby="prayer-requests-heading"
    >
      <PrayerRequestsListClient initialRequests={requests} />
    </section>
  );
}
