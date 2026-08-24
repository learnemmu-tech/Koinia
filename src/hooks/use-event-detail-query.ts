"use client";

import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";

import type { FirebaseEvent } from "@/types/firebase-event";

import {
  EVENTS_COLLECTION,
  normalizeEventFromFirestore,
} from "@/lib/event-firestore";
import { db } from "@/lib/firebase";
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
      const snapshot = await getDoc(doc(db, EVENTS_COLLECTION, eventId));
      if (!snapshot.exists()) return null;
      return normalizeEventFromFirestore(
        snapshot.id,
        snapshot.data() as Record<string, unknown>
      );
    },
    initialData: initialEvent,
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });
}
