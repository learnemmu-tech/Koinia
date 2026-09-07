import type { FirebaseDonationCampaign } from "@/types/firebase-donation";

import { DonationCampaignCard } from "@/components/donations/donation-campaign-card";

import { HomeCollectionRail, homeRailItemClass, HOME_RAIL_LANDSCAPE } from "./home-collection-rail";
import { HomeEmptyState } from "./home-empty-state";
import { HomeSectionHeader } from "./home-section-header";

type HomeDonationsSectionProps = {
  campaigns: FirebaseDonationCampaign[];
};

export function HomeDonationsSection({ campaigns }: HomeDonationsSectionProps) {
  const visible = campaigns.slice(0, 3);

  return (
    <section aria-labelledby="home-donations-heading" className="space-y-3">
      <HomeSectionHeader
        id="home-donations-heading"
        title="Support the Mission"
        description="Help ministries serve their communities, reach people with the Gospel, and create spaces where faith can grow."
        href="/donations"
        viewAllLabel="View All Campaigns"
      />
      {visible.length === 0 ?
        <HomeEmptyState
          title="No campaigns yet"
          description="Active giving campaigns will appear here when they are published."
        />
      : <HomeCollectionRail className="md:mx-0 md:grid md:grid-cols-2 md:items-stretch md:overflow-visible md:px-0 lg:grid-cols-3">
          {visible.map((campaign) => (
            <div
              key={campaign.id}
              className={`${homeRailItemClass(HOME_RAIL_LANDSCAPE)} md:h-full`}
            >
              <DonationCampaignCard campaign={campaign} className="h-full" />
            </div>
          ))}
        </HomeCollectionRail>
      }
    </section>
  );
}
