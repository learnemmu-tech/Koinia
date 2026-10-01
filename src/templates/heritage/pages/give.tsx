import { DonationCampaignDetailClient } from "@/components/donations/donation-campaign-detail-client";
import { DonationsListClient } from "@/components/donations/donations-list-client";
import { tenantContentQuery } from "@/lib/content/content-scope";
import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { listDonationCampaigns } from "@/lib/postgres/features";
import type { FirebaseDonationCampaign } from "@/types/firebase-donation";
import { HeritageContentFrame } from "@/templates/heritage/components/heritage-content-frame";

export async function HeritageGivePage({ model }: { model: ChurchWebsiteViewModel }) {
  const campaigns = await listDonationCampaigns(
    tenantContentQuery({
      organizationId: model.church.organizationId,
      churchId: model.church.id,
    }),
    { publishedOnly: true, limit: 80 }
  );

  return (
    <HeritageContentFrame
      churchName={model.church.name}
      eyebrow="Give"
      title="Donations"
      description="Support active ministry campaigns with secure, transparent giving."
    >
      <DonationsListClient
        initialCampaigns={campaigns}
        clientSync={false}
        hrefPrefix={churchWebsitePath(model.church.slug, "/give")}
      />
    </HeritageContentFrame>
  );
}

export function HeritageGiveDetailPage({
  model,
  item,
}: {
  model: ChurchWebsiteViewModel;
  item: FirebaseDonationCampaign;
}) {
  return (
    <div className="heritage-content-system min-h-full">
      <DonationCampaignDetailClient
        campaignId={item.id}
        initialCampaign={item}
        listHref={churchWebsitePath(model.church.slug, "/give")}
        clientSync={false}
      />
    </div>
  );
}
