import type { Metadata } from "next";

import { DonationsListClient } from "@/components/donations/donations-list-client";
import { DonationsAdminBar } from "@/components/admin/inline/donations-admin-bar";
import { resolvePageContentQuery } from "@/lib/content/page-content-query";
import { getActiveDonationCampaignsCached } from "@/lib/cached-donation-data";
import { pageContentClass, typePageTitleClass } from "@/lib/responsive-classes";
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
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/60">
            Give
          </p>
          <h1 id="donations-heading" className={typePageTitleClass}>
            Donations
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Support active ministry campaigns with secure, transparent giving.
          </p>
        </div>
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
