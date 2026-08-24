"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";

import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { db } from "@/lib/firebase";
import {
  normalizePrayerRequestFromFirestore,
  PRAYER_REQUESTS_COLLECTION,
} from "@/lib/prayer-request-firestore";

export function useUserPrayerRequests() {
  const { user } = useFirebaseAuth();
  const [requests, setRequests] = useState<FirebasePrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const requestsQuery = query(
      collection(db, PRAYER_REQUESTS_COLLECTION),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      requestsQuery,
      (snapshot) => {
        setRequests(
          snapshot.docs.map((docSnap) =>
            normalizePrayerRequestFromFirestore(
              docSnap.id,
              docSnap.data() as Record<string, unknown>
            )
          )
        );
        setLoading(false);
      },
      () => setLoading(false)
    );

    return unsubscribe;
  }, [user?.uid]);

  const grouped = useMemo(() => {
    const pending = requests.filter((request) => request.status === "pending");
    const approved = requests.filter((request) => request.status === "approved");
    return { pending, approved, all: requests };
  }, [requests]);

  return { requests, grouped, loading };
}
