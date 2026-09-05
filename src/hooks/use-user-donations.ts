"use client";

import { useQuery } from "@tanstack/react-query";

import type { FirebaseDonation } from "@/types/firebase-donation";

import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { getDonationsByEmail } from "@/lib/firebase-donation-queries";
import { QUERY_GC_TIME, QUERY_STALE_TIME } from "@/lib/react-query-config";

export function useUserDonations() {
  const { authUser } = useFirebaseAuth();
  const donorEmail = authUser?.email?.trim() ?? "";

  const { data: donations = [], isLoading } = useQuery({
    queryKey: ["user-donations", donorEmail],
    enabled: Boolean(donorEmail),
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
    queryFn: () => getDonationsByEmail(donorEmail),
  });

  const completedDonations = donations.filter(
    (donation) => donation.paymentStatus === "completed"
  );

  return {
    donations,
    completedDonations,
    loading: isLoading,
  };
}
