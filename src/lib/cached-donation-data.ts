import { cache } from "react";

import { unstable_cache } from "next/cache";



import {

  getActiveDonationCampaigns,

  getDonationCampaignById,

} from "./firebase-donation-queries";

import type { ContentQueryInput } from "@/lib/content/content-scope";
import {
  contentCacheKey,
  recordMatchesContentQuery,
} from "@/lib/content/content-scope";



const REVALIDATE_SECONDS = 60;



function tenantCacheKey(scope: ContentQueryInput): string {
  return contentCacheKey(scope);
}

export async function getActiveDonationCampaignsCached(
  scope: ContentQueryInput,
  limit?: number
) {
  const key = tenantCacheKey(scope);

  return unstable_cache(
    async () => getActiveDonationCampaigns(scope, { limit }),
    ["active-donation-campaigns", key, limit != null ? `limit-${limit}` : "all"],
    { revalidate: REVALIDATE_SECONDS, tags: ["donations", `tenant-${key}`] }
  )();
}



export const getDonationCampaignByIdCached = cache(
  async (scope: ContentQueryInput, campaignId: string) => {
    const key = tenantCacheKey(scope);
    return unstable_cache(
      async () => {
        const campaign = await getDonationCampaignById(campaignId);
        if (!recordMatchesContentQuery(campaign, scope)) {
          return null;
        }
        return campaign;
      },

      ["donation-campaign-by-id", key, campaignId],

      {

        revalidate: REVALIDATE_SECONDS,

        tags: [`donation-campaign-${campaignId}`, `tenant-${key}`],

      }

    )();

  }

);


