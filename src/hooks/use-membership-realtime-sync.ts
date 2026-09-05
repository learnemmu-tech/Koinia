"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useFirebaseAuth } from "@/context/firebase-auth-context";

export function useMembershipRealtimeSync() {
  const { authUser } = useFirebaseAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authUser?.uid) return;

    const interval = window.setInterval(() => {
      void queryClient.invalidateQueries({ queryKey: ["membership-routing"] });
    }, 120_000);

    return () => window.clearInterval(interval);
  }, [authUser?.uid, queryClient]);
}
