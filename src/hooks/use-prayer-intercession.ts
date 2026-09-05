"use client";

import { useQuery } from "@tanstack/react-query";

import { userHasPrayedForRequest } from "@/lib/prayer-intercession-actions";
import { QUERY_GC_TIME, QUERY_STALE_TIME } from "@/lib/react-query-config";

export function usePrayerIntercession(
  requestId: string,
  userId: string | undefined
) {
  const { data: hasPrayed = false, isLoading } = useQuery({
    queryKey: ["prayer-intercession", requestId, userId],
    enabled: Boolean(userId && requestId),
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
    queryFn: async () => {
      if (!userId || !requestId) return false;
      return userHasPrayedForRequest(requestId, userId);
    },
  });

  return { hasPrayed, loading: isLoading };
}
