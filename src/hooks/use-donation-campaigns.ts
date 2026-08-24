"use client";

import { useQuery } from "@tanstack/react-query";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import type { FirebaseDonationCampaign } from "@/types/firebase-donation";

import {
  useContentTenantScope,
  useTenantMatchOptions,
} from "@/hooks/use-workspace-tenant-scope";
import {
  DONATION_CAMPAIGNS_COLLECTION,
  filterActiveCampaigns,
  normalizeDonationCampaignFromFirestore,
} from "@/lib/donation-firestore";
import { db } from "@/lib/firebase";
import {
  filterRecordsByTenant,
  recordMatchesTenantScope,
} from "@/lib/organization/tenant-scope";
import {
  DEFAULT_LIST_LIMIT,
  QUERY_GC_TIME,
  QUERY_STALE_TIME,
} from "@/lib/react-query-config";
import { buildWorkspaceChurchTenantQuery } from "@/lib/tenant-query-builder";

type UseActiveDonationCampaignsOptions = {
  maxItems?: number;
};

export function useActiveDonationCampaigns(
  initialData: FirebaseDonationCampaign[] = [],
  options: UseActiveDonationCampaignsOptions = {}
) {
  const { maxItems } = options;
  const scope = useContentTenantScope();
  const matchOptions = useTenantMatchOptions();
  const pageSize = maxItems ?? DEFAULT_LIST_LIMIT;

  const { data: campaigns = initialData, isLoading } = useQuery({
    queryKey: [
      "active-donation-campaigns",
      scope.churchId,
      scope.organizationId,
      scope.branchId,
      pageSize,
    ],
    enabled: !scope.blocked,
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
    queryFn: async () => {
      const campaignsQuery = buildWorkspaceChurchTenantQuery(
        collection(db, DONATION_CAMPAIGNS_COLLECTION),
        scope,
        where("status", "==", "active"),
        orderBy("createdAt", "desc"),
        limit(pageSize)
      );

      if (!campaignsQuery) return [];

      const snapshot = await getDocs(campaignsQuery);
      let next = filterActiveCampaigns(
        filterRecordsByTenant(
          snapshot.docs.map((docSnap) =>
            normalizeDonationCampaignFromFirestore(
              docSnap.id,
              docSnap.data() as Record<string, unknown>
            )
          ),
          scope,
          matchOptions
        )
      );

      if (maxItems !== undefined) {
        next = next.slice(0, maxItems);
      }

      return next;
    },
  });

  const loading = scope.isLoading || isLoading;

  return { campaigns, loading };
}

export function useDonationCampaign(
  campaignId: string,
  initialData?: FirebaseDonationCampaign | null
) {
  const scope = useContentTenantScope();
  const matchOptions = useTenantMatchOptions();

  const { data: campaign = initialData ?? null, isLoading } = useQuery({
    queryKey: [
      "donation-campaign",
      campaignId,
      scope.churchId,
      scope.organizationId,
      scope.branchId,
    ],
    enabled: Boolean(campaignId),
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
    initialData: initialData ?? undefined,
    queryFn: async () => {
      const snapshot = await getDoc(
        doc(db, DONATION_CAMPAIGNS_COLLECTION, campaignId)
      );

      if (!snapshot.exists()) return null;

      const normalized = normalizeDonationCampaignFromFirestore(
        snapshot.id,
        snapshot.data() as Record<string, unknown>
      );

      return recordMatchesTenantScope(normalized, scope, matchOptions)
        ? normalized
        : null;
    },
  });

  return { campaign, loading: isLoading };
}
