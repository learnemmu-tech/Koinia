"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useOrganizationOptional } from "@/context/organization-context";
import { firebaseAuth } from "@/lib/firebase-auth-service";
import {
  resolveMembershipRouting,
  type MembershipRoutingResult,
} from "@/lib/auth/membership-routing";
import { getWorkspaceType } from "@/lib/organization/workspace-type";
import { QUERY_STALE_TIME } from "@/lib/react-query-config";

/**
 * Fallback only when OrganizationProvider is absent.
 * Normal app shell derives routing from the organization snapshot to avoid a
 * second Neon round-trip (/api/auth/routing) competing with org + RSC.
 */
async function fetchMembershipRouting(): Promise<MembershipRoutingResult | null> {
  const user = firebaseAuth.currentUser;
  if (!user) return null;

  const token = await user.getIdToken();
  // No callbackUrl — this is session membership status, not post-auth redirect.
  const res = await fetch("/api/auth/routing", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return null;
  return res.json() as Promise<MembershipRoutingResult>;
}

/** Stable key — do not include pathname (avoids duplicate parallel fetches). */
export const MEMBERSHIP_ROUTING_QUERY_KEY = ["membership-routing"] as const;

/**
 * Session membership routing for guards.
 * Do not pass callbackUrl "/" here — that is only for post-auth redirects and
 * would override admin role-aware defaults, breaking sidebar /dashboard links.
 */
export function useMembershipRouting(_callbackUrl?: string) {
  const { authUser, profile, profileReady } = useFirebaseAuth();
  const organization = useOrganizationOptional();

  const derivedRouting = useMemo((): MembershipRoutingResult | null => {
    if (!authUser || !profileReady || !profile) return null;
    // OrganizationProvider is present in the app shell — wait for it to settle
    // and derive locally instead of hitting /api/auth/routing.
    if (organization) {
      if (organization.loading) return null;
      return resolveMembershipRouting({
        profile,
        membership: organization.membership,
        branchMemberships: organization.branchMemberships,
        churchesCount: organization.churches.length,
        workspaceType: getWorkspaceType(organization.organization),
        organizationStatus: organization.organization?.status ?? null,
      });
    }
    return null;
  }, [
    authUser,
    profileReady,
    profile,
    organization,
    organization?.loading,
    organization?.membership,
    organization?.branchMemberships,
    organization?.churches,
    organization?.organization,
  ]);

  const needsApiFallback = Boolean(authUser) && profileReady && !organization;

  const query = useQuery({
    queryKey: MEMBERSHIP_ROUTING_QUERY_KEY,
    queryFn: () => fetchMembershipRouting(),
    enabled: needsApiFallback,
    staleTime: QUERY_STALE_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });

  const routing = derivedRouting ?? query.data ?? null;
  const loading =
    Boolean(authUser) &&
    (!profileReady ||
      Boolean(organization?.loading) ||
      (needsApiFallback && query.isLoading && !query.data));

  return {
    routing,
    loading,
  };
}
