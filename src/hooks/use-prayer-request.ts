"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";

import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";

import { db } from "@/lib/firebase";
import {
  normalizePrayerRequestFromFirestore,
  PRAYER_REQUESTS_COLLECTION,
} from "@/lib/prayer-request-firestore";

export function usePrayerRequest(
  requestId: string,
  initialRequest: FirebasePrayerRequest | null = null
) {
  const [request, setRequest] = useState(initialRequest);
  const [loading, setLoading] = useState(!initialRequest);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, PRAYER_REQUESTS_COLLECTION, requestId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setRequest(null);
        } else {
          setRequest(
            normalizePrayerRequestFromFirestore(
              snapshot.id,
              snapshot.data() as Record<string, unknown>
            )
          );
        }
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [requestId]);

  return { request, loading };
}
