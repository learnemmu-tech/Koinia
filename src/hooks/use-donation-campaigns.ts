"use client";

import { useQuery } from "@tanstack/react-query";

import type { FirebaseDonationCampaign } from "@/types/firebase-donation";

import { fetchTenantContentPage } from "@/lib/api-client";
import { useContentTenantScope } from "@/hooks/use-workspace-tenant-scope";
import { getDonationCampaignById } from "@/lib/firebase-donation-queries";
import { filterActiveCampaigns } from "@/lib/donation-firestore";
import {
  DEFAULT_LIST_LIMIT,
  QUERY_GC_TIME,
  QUERY_STALE_TIME,
} from "@/lib/react-query-config";

type UseActiveDonationCampaignsOptions = {
  maxItems?: number;
};

export function useActiveDonationCampaigns(
  initialData: FirebaseDonationCampaign[] = [],
  options: UseActiveDonationCampaignsOptions = {}
) {
  const { maxItems } = options;
  const scope = useContentTenantScope();
  const pageSize = maxItems ?? DEFAULT_LIST_LIMIT;

  const { data: campaigns = initialData, isLoading } = useQuery({
    queryKey: [
      "active-donation-campaigns",
      scope.churchId,
      scope.organizationId,
      pageSize,
    ],
    enabled: !scope.blocked,
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
    queryFn: async () => {
      const page = await fetchTenantContentPage<FirebaseDonationCampaign>({
        collection: "donationCampaigns",
        churchId: scope.churchId,
        organizationId: scope.organizationId,
        limit: pageSize,
      });
      let next = filterActiveCampaigns(page.items);
      if (maxItems !== undefined) {
        next = next.slice(0, maxItems);
      }
      return next;
    },
  });

  return { campaigns, loading: scope.isLoading || isLoading };
}

export function useDonationCampaign(
  campaignId: string,
  initialData?: FirebaseDonationCampaign | null
) {
  const { data: campaign = initialData ?? null, isLoading } = useQuery({
    queryKey: ["donation-campaign", campaignId],
    enabled: Boolean(campaignId),
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
    initialData: initialData ?? undefined,
    queryFn: () => getDonationCampaignById(campaignId),
  });

  return { campaign, loading: isLoading };
}
