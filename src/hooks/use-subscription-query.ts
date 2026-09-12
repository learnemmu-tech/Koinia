"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { firebaseAuth } from "@/lib/firebase-auth-service";
import { QUERY_STALE_TIME } from "@/lib/react-query-config";
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

/**
 * Subscription is not required to paint Songs/Sermons/etc.
 * Defer until after first paint so it does not compete with org + RSC for Neon.
 */
function useAfterFirstPaint() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let innerId = 0;
    const outerId = window.requestAnimationFrame(() => {
      innerId = window.requestAnimationFrame(() => setReady(true));
    });
    return () => {
      window.cancelAnimationFrame(outerId);
      if (innerId) window.cancelAnimationFrame(innerId);
    };
  }, []);
  return ready;
}

export function useSubscriptionQuery(organizationId: string | null | undefined) {
  const afterPaint = useAfterFirstPaint();
  const enabled = Boolean(organizationId) && afterPaint;

  return useQuery({
    queryKey: ["subscription", organizationId],
    queryFn: () => fetchSubscription(organizationId!),
    enabled,
    staleTime: QUERY_STALE_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
