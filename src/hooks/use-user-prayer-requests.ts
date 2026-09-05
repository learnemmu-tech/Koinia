"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";

import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { listMyPrayerRequests } from "@/lib/prayer-user-actions";
import { QUERY_GC_TIME, QUERY_STALE_TIME } from "@/lib/react-query-config";

export function useUserPrayerRequests() {
  const { user } = useFirebaseAuth();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["user-prayer-requests", user?.uid],
    enabled: Boolean(user?.uid),
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
    queryFn: () => listMyPrayerRequests(user!.uid),
  });

  const grouped = useMemo(() => {
    const pending = requests.filter((request) => request.status === "pending");
    const approved = requests.filter((request) => request.status === "approved");
    return { pending, approved, all: requests };
  }, [requests]);

  return { requests, grouped, loading: isLoading };
}
