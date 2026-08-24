import { cache } from "react";

import { unstable_cache } from "next/cache";



import {

  getActiveDonationCampaigns,

  getDonationCampaignById,

} from "./firebase-donation-queries";

import {

  recordMatchesTenantScope,

  type TenantScope,

} from "./organization/tenant-scope";



const REVALIDATE_SECONDS = 60;



function tenantCacheKey(scope: TenantScope): string {

  return `${scope.organizationId}:${scope.churchId}:${scope.branchId ?? ""}`;

}



export async function getActiveDonationCampaignsCached(scope: TenantScope) {

  const key = tenantCacheKey(scope);

  return unstable_cache(

    async () => getActiveDonationCampaigns(scope),

    ["active-donation-campaigns", key],

    { revalidate: REVALIDATE_SECONDS, tags: ["donations", `tenant-${key}`] }

  )();

}



export const getDonationCampaignByIdCached = cache(

  async (scope: TenantScope, campaignId: string) => {

    const key = tenantCacheKey(scope);

    return unstable_cache(

      async () => {

        const campaign = await getDonationCampaignById(campaignId);

        if (

          !recordMatchesTenantScope(campaign, scope, {

            allowLegacyBranchless: true,

            defaultBranchId: scope.branchId ?? null,

          })

        ) {

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


