"use client";

import { firebaseAuth } from "@/lib/firebase-auth-service";

export async function fetchWithAuth(input: string, init?: RequestInit) {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const token = await user.getIdToken();
  const response = await fetch(input, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });
  return response;
}

export async function fetchTenantContentPage<T>(input: {
  collection: string;
  churchId?: string;
  organizationId?: string;
  offset?: number;
  limit?: number;
  ids?: string[];
}): Promise<{ items: T[]; hasMore: boolean }> {
  const params = new URLSearchParams({
    collection: input.collection,
    offset: String(input.offset ?? 0),
    limit: String(input.limit ?? 20),
  });
  if (input.churchId) params.set("churchId", input.churchId);
  if (input.organizationId) params.set("organizationId", input.organizationId);
  if (input.ids?.length) params.set("ids", input.ids.join(","));

  const response = await fetchWithAuth(`/api/tenant-content?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to load content");
  }
  return response.json() as Promise<{ items: T[]; hasMore: boolean }>;
}
