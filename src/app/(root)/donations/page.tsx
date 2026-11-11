import type { Metadata } from "next";

import { CatalogPager } from "@/components/worship/catalog-pager";
import { DonationsListClient } from "@/components/donations/donations-list-client";
import { DonationsAdminBar } from "@/components/admin/inline/donations-admin-bar";
import { I18nPageHeading } from "@/components/i18n/page-heading";
import { catalogPageQuery, sliceCatalogPage } from "@/lib/content/catalog-page";
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

export default async function DonationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const { page, offset, limit } = catalogPageQuery(pageParam);
  const { contentQuery, isPlatformPublic } = await resolvePageContentQuery();
  const loaded = await getActiveDonationCampaignsCached(contentQuery, limit, offset);
  const { items: campaigns, hasMore } = sliceCatalogPage(loaded);

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
        applyDonationEntitlement
      />
      <CatalogPager page={page} hasMore={hasMore} />
    </section>
  );
}
