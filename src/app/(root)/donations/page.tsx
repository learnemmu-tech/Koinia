import type { Metadata } from "next";

import { DonationsListClient } from "@/components/donations/donations-list-client";
import { DonationsAdminBar } from "@/components/admin/inline/donations-admin-bar";
import { I18nPageHeading } from "@/components/i18n/page-heading";
import { resolvePageContentQuery } from "@/lib/content/page-content-query";
import { getActiveDonationCampaignsCached } from "@/lib/cached-donation-data";
import { pageContentClass } from "@/lib/responsive-classes";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = buildPageMetadata({
  title: "Donation Campaigns",
  description:
    "Support Christian ministry through secure online giving on FaithConnectHub. Browse active donation campaigns and contribute with transparency.",
  path: "/donations",
  keywords: ["Christian donations", "online giving", "ministry support", "church donations"],
});

export default async function DonationsPage() {
  const { contentQuery, isPlatformPublic } = await resolvePageContentQuery();
  const campaigns = await getActiveDonationCampaignsCached(contentQuery);

  return (
    <section
      className={pageContentClass}
      aria-labelledby="donations-heading"
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <I18nPageHeading ns="donations" headingId="donations-heading" />
        <DonationsAdminBar
          contentScope={isPlatformPublic ? "platform_public" : "organization"}
        />
      </header>

      <DonationsListClient
        initialCampaigns={campaigns}
        isPlatformPublic={isPlatformPublic}
      />
    </section>
  );
}
