import type { Metadata } from "next";

import { DonationCampaignDetailClient } from "@/components/donations/donation-campaign-detail-client";
import { JsonLd } from "@/components/seo/json-ld";
import { getPageTenantContext } from "@/lib/church-page-data";
import { getDonationCampaignByIdCached } from "@/lib/cached-donation-data";
import { buildBreadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";

export const revalidate = 60;

type DonationCampaignPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: DonationCampaignPageProps): Promise<Metadata> {
  const { id } = await params;
  const { scope } = await getPageTenantContext();
  const campaign = await getDonationCampaignByIdCached(scope, id);

  if (!campaign) {
    return { title: "Campaign Not Found" };
  }

  return buildPageMetadata({
    title: campaign.title,
    description:
      campaign.description ??
      "Support this Christian ministry campaign through secure online giving on FaithConnectHub.",
    path: `/donations/${encodeURIComponent(id)}`,
    keywords: [campaign.title, "Christian donation", "ministry giving", "online giving"],
  });
}

export default async function DonationCampaignPage({
  params,
}: DonationCampaignPageProps) {
  const { id } = await params;
  const { scope } = await getPageTenantContext();
  const campaign = await getDonationCampaignByIdCached(scope, id);
  const path = `/donations/${encodeURIComponent(id)}`;

  return (
    <article
      aria-label={campaign?.title ?? "Donation campaign"}
      className="mx-auto w-full min-w-0 max-w-5xl pb-10"
    >
      {campaign ?
        <JsonLd
          data={buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Donations", path: "/donations" },
            { name: campaign.title, path },
          ])}
        />
      : null}
      <DonationCampaignDetailClient campaignId={id} initialCampaign={campaign} />
    </article>
  );
}
