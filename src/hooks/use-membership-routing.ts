"use client";

import { useQuery } from "@tanstack/react-query";

import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { firebaseAuth } from "@/lib/firebase-auth-service";
import type { MembershipRoutingResult } from "@/lib/auth/membership-routing";
import { sanitizeCallbackUrl } from "@/lib/callback-url";
import { QUERY_STALE_TIME } from "@/lib/react-query-config";

async function fetchMembershipRouting(
  callbackUrl: string
): Promise<MembershipRoutingResult | null> {
  const user = firebaseAuth.currentUser;
  if (!user) return null;

  const token = await user.getIdToken();
  const redirectTo = sanitizeCallbackUrl(callbackUrl);
  const params = new URLSearchParams({ callbackUrl: redirectTo });
  const res = await fetch(`/api/auth/routing?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return null;
  return res.json() as Promise<MembershipRoutingResult>;
}

export function useMembershipRouting(callbackUrl = "/") {
  const { authUser } = useFirebaseAuth();

  const query = useQuery({
    queryKey: ["membership-routing", callbackUrl],
    queryFn: () => fetchMembershipRouting(callbackUrl),
    enabled: Boolean(authUser),
    staleTime: QUERY_STALE_TIME,
    refetchOnWindowFocus: false,
  });

  return {
    routing: query.data ?? null,
    loading: query.isLoading && Boolean(authUser),
  };
}
