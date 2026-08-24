"use client";

import { useQuery } from "@tanstack/react-query";

import { firebaseAuth } from "@/lib/firebase-auth-service";
import type { SubscriptionSnapshot } from "@/types/subscription";

async function fetchSubscription(
  organizationId: string
): Promise<SubscriptionSnapshot> {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const token = await user.getIdToken();
  const response = await fetch(
    `/api/subscription?organizationId=${encodeURIComponent(organizationId)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(body.error ?? "Failed to load subscription");
  }

  return response.json() as Promise<SubscriptionSnapshot>;
}

export function useSubscriptionQuery(organizationId: string | null | undefined) {
  const enabled = Boolean(organizationId);

  return useQuery({
    queryKey: ["subscription", organizationId],
    queryFn: () => fetchSubscription(organizationId!),
    enabled,
    staleTime: 30_000,
  });
}
