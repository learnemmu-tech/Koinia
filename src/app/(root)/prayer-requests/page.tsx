import type { Metadata } from "next";



import { PrayerRequestsListClient } from "@/components/prayer/prayer-requests-list-client";

import { getPageTenantContext } from "@/lib/church-page-data";

import { getApprovedPrayerRequestsCached } from "@/lib/cached-prayer-data";

import { pageContentClass } from "@/lib/responsive-classes";

import { buildPageMetadata } from "@/lib/seo";



export const revalidate = 60;



export const metadata: Metadata = buildPageMetadata({

  title: "Prayer Wall",

  description:

    "Lift each other up in prayer. Share prayer needs and join the FaithConnectHub community in intercession.",

  path: "/prayer-requests",

  keywords: ["prayer wall", "prayer requests", "Christian prayer", "intercession"],

});



export default async function PrayerRequestsPage() {

  const { scope } = await getPageTenantContext();

  const requests = await getApprovedPrayerRequestsCached(scope);



  return (

    <section

      className={pageContentClass}

      aria-labelledby="prayer-requests-heading"

    >

      <PrayerRequestsListClient initialRequests={requests} />

    </section>

  );

}

