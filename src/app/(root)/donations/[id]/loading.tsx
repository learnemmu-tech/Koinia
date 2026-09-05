import { DonationCampaignDetailSkeleton } from "@/components/donations/donation-campaign-detail-client";

export default function DonationCampaignLoading() {
  return (
    <div className="-mx-4 min-h-full bg-background sm:-mx-6 md:-mx-8">
      <DonationCampaignDetailSkeleton />
    </div>
  );
}
