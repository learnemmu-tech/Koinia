"use client";

import { useQuery } from "@tanstack/react-query";

import type { FirebaseDonation } from "@/types/firebase-donation";

import { getRecentDonations } from "@/lib/firebase-donation-queries";
import { QUERY_GC_TIME, QUERY_STALE_TIME } from "@/lib/react-query-config";

export function useRecentDonations(
  initialData: FirebaseDonation[] = [],
  maxItems = 10
) {
  const { data: donations = initialData, isLoading } = useQuery({
    queryKey: ["recent-donations", maxItems],
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
    queryFn: () => getRecentDonations(maxItems),
  });

  return { donations, loading: isLoading };
}
