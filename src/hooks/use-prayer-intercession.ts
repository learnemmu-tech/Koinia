"use client";

import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";
import {
  buildPrayerIntercessionId,
  PRAYER_INTERCESSIONS_COLLECTION,
} from "@/lib/prayer-request-firestore";
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

      const intercessionRef = doc(
        db,
        PRAYER_INTERCESSIONS_COLLECTION,
        buildPrayerIntercessionId(requestId, userId)
      );
      const snapshot = await getDoc(intercessionRef);
      return snapshot.exists();
    },
  });

  return { hasPrayed, loading: isLoading };
}
