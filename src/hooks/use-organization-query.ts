"use client";

import { useQuery } from "@tanstack/react-query";

import { firebaseAuth } from "@/lib/firebase-auth-service";
import type { OrganizationSnapshot } from "@/lib/organization/organization-server";
import { QUERY_STALE_TIME } from "@/lib/react-query-config";

async function fetchOrganization(
  organizationId?: string | null
): Promise<OrganizationSnapshot | null> {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const token = await user.getIdToken();
  const query = organizationId ?
    `?organizationId=${encodeURIComponent(organizationId)}`
  : "";

  const response = await fetch(`/api/organization${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(body.error ?? "Failed to load organization");
  }

  return response.json() as Promise<OrganizationSnapshot>;
}

export function useOrganizationQuery(
  organizationId?: string | null,
  enabled = true
) {
  return useQuery({
    queryKey: ["organization", organizationId ?? "default"],
    queryFn: () => fetchOrganization(organizationId),
    staleTime: QUERY_STALE_TIME,
    enabled: enabled && organizationId !== null,
  });
}
