"use client";

import { useEffect, useState } from "react";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import type { FirebaseDonation } from "@/types/firebase-donation";

import {
  DONATIONS_COLLECTION,
  normalizeDonationFromFirestore,
} from "@/lib/donation-firestore";
import { db } from "@/lib/firebase";

export function useRecentDonations(
  initialData: FirebaseDonation[] = [],
  maxItems = 10
) {
  const [donations, setDonations] = useState(initialData);
  const [loading, setLoading] = useState(initialData.length === 0);

  useEffect(() => {
    const donationsQuery = query(
      collection(db, DONATIONS_COLLECTION),
      orderBy("createdAt", "desc"),
      limit(maxItems)
    );

    const unsubscribe = onSnapshot(
      donationsQuery,
      (snapshot) => {
        setDonations(
          snapshot.docs.map((docSnap) =>
            normalizeDonationFromFirestore(
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
  }, [maxItems]);

  return { donations, loading };
}
