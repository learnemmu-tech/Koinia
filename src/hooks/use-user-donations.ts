"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import type { FirebaseDonation } from "@/types/firebase-donation";

import { useFirebaseAuth } from "@/context/firebase-auth-context";
import {
  DONATIONS_COLLECTION,
  normalizeDonationFromFirestore,
} from "@/lib/donation-firestore";
import { db } from "@/lib/firebase";

export function useUserDonations() {
  const { authUser } = useFirebaseAuth();
  const donorEmail = authUser?.email?.trim() ?? "";
  const [donations, setDonations] = useState<FirebaseDonation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!donorEmail) {
      setDonations([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const donationsQuery = query(
      collection(db, DONATIONS_COLLECTION),
      where("donorEmail", "==", donorEmail),
      orderBy("createdAt", "desc")
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
  }, [donorEmail]);

  const completedDonations = donations.filter(
    (donation) => donation.paymentStatus === "completed"
  );

  return {
    donations,
    completedDonations,
    loading,
  };
}
