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
      // Routing is derived from organization snapshot in the app shell.
      void queryClient.invalidateQueries({ queryKey: ["organization"] });
    }, 5 * 60_000);

    return () => window.clearInterval(interval);
  }, [authUser?.uid, queryClient]);
}
