"use client";

import { useQuery } from "@tanstack/react-query";

import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";

import { getPrayerRequestById } from "@/lib/firebase-prayer-request-queries";
import { QUERY_GC_TIME, QUERY_STALE_TIME } from "@/lib/react-query-config";

export function usePrayerRequest(
  requestId: string,
  initialRequest: FirebasePrayerRequest | null = null
) {
  const { data: request = initialRequest, isLoading } = useQuery({
    queryKey: ["prayer-request", requestId],
    enabled: Boolean(requestId),
    initialData: initialRequest ?? undefined,
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
    queryFn: () => getPrayerRequestById(requestId),
  });

  return { request: request ?? null, loading: isLoading };
}
