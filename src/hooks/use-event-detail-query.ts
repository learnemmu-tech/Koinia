"use client";

import { useQuery } from "@tanstack/react-query";

import type { FirebaseEvent } from "@/types/firebase-event";

import { fetchTenantContentPage } from "@/lib/api-client";
import {
  QUERY_GC_TIME,
  QUERY_STALE_TIME,
} from "@/lib/react-query-config";

export function useEventDetailQuery(
  eventId: string,
  initialEvent: FirebaseEvent
) {
  return useQuery({
    queryKey: ["event-detail", eventId],
    queryFn: async () => {
      const page = await fetchTenantContentPage<FirebaseEvent>({
        collection: "events",
        ids: [eventId],
        limit: 1,
      });
      return page.items[0] ?? initialEvent;
    },
    initialData: initialEvent,
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });
}
