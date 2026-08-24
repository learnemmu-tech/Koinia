"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { doc, onSnapshot } from "firebase/firestore";

import { useFirebaseAuth } from "@/context/firebase-auth-context";
import {
  BRANCH_MEMBERSHIPS_COLLECTION,
  resolveBranchMembershipDocumentId,
} from "@/lib/organization/branch-membership-firestore";
import { db } from "@/lib/firebase";

/**
 * Keeps profile and membership routing in sync when Firestore membership
 * documents change (e.g. admin approves a pending member).
 */
export function useMembershipRealtimeSync() {
  const { authUser, profile, refreshProfile } = useFirebaseAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authUser?.uid) return;

    const invalidateRouting = () => {
      void refreshProfile();
      void queryClient.invalidateQueries({ queryKey: ["membership-routing"] });
      void queryClient.invalidateQueries({ queryKey: ["organization"] });
    };

    const userRef = doc(db, "users", authUser.uid);
    const unsubscribeUser = onSnapshot(userRef, invalidateRouting);

    const branchIds = new Set<string>();
    const pendingId = profile?.pendingBranchId?.trim();
    const activeId = profile?.activeBranchId?.trim();
    if (pendingId) branchIds.add(pendingId);
    if (activeId) branchIds.add(activeId);

    const membershipUnsubs = [...branchIds].map((branchId) => {
      const membershipId = resolveBranchMembershipDocumentId(
        branchId,
        authUser.uid
      );
      return onSnapshot(
        doc(db, BRANCH_MEMBERSHIPS_COLLECTION, membershipId),
        invalidateRouting
      );
    });

    return () => {
      unsubscribeUser();
      membershipUnsubs.forEach((unsub) => unsub());
    };
  }, [
    authUser?.uid,
    profile?.pendingBranchId,
    profile?.activeBranchId,
    refreshProfile,
    queryClient,
  ]);
}
