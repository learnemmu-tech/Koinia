"use client";

import React from "react";

import type { FirebaseBranch } from "@/types/branch";
import type { FirebaseChurch } from "@/types/firebase-church";
import type { FirebaseMembership } from "@/types/membership";
import type { FirebaseOrganization } from "@/types/organization";
import type { FirebaseBranchMembership } from "@/types/branch-membership";

import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useOrganizationQuery } from "@/hooks/use-organization-query";
import { firebaseAuth } from "@/lib/firebase-auth-service";
import {
  filterChurchesByOrganization,
  organizationOwnsMultipleChurches,
} from "@/lib/organization/tenant-scope";

type OrganizationContextValue = {
  organization: FirebaseOrganization | null;
  membership: FirebaseMembership | null;
  branchMembership: FirebaseBranchMembership | null;
  branchMemberships: FirebaseBranchMembership[];
  churches: FirebaseChurch[];
  branchesByChurch: Record<string, FirebaseBranch[]>;
  loading: boolean;
  error: string | null;
  showChurchSwitcher: boolean;
  refetch: () => Promise<unknown>;
  ensureOrganization: () => Promise<void>;
};

const OrganizationContext =
  React.createContext<OrganizationContextValue | null>(null);

export function OrganizationProvider({ children }: React.PropsWithChildren) {
  const { authUser, profile, profileReady } = useFirebaseAuth();
  const organizationId = profile?.organizationId?.trim() || undefined;
  // Wait until the profile is known. Fetching once with no id and again
  // with the id made every signed-in load hit /api/organization twice.
  const { data, isLoading, error, refetch } = useOrganizationQuery(
    organizationId,
    Boolean(authUser) && profileReady
  );

  const churches = React.useMemo(() => {
    if (!data?.organization) return data?.churches ?? [];
    return filterChurchesByOrganization(
      data.churches,
      data.organization.id
    );
  }, [data]);

  const showChurchSwitcher = React.useMemo(() => {
    if (!data?.organization) return false;
    return organizationOwnsMultipleChurches(churches, data.organization.id);
  }, [data, churches]);

  const ensureOrganization = React.useCallback(async () => {
    const user = firebaseAuth.currentUser;
    if (!user) return;

    const token = await user.getIdToken();
    await fetch("/api/organization", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "My Organization" }),
    });
    await refetch();
  }, [refetch]);

  const value = React.useMemo(
    (): OrganizationContextValue => ({
      organization: data?.organization ?? null,
      membership: data?.membership ?? null,
      branchMembership: data?.branchMembership ?? null,
      branchMemberships: data?.branchMemberships ?? [],
      churches,
      branchesByChurch: data?.branchesByChurch ?? {},
      loading: Boolean(authUser) && (!profileReady || isLoading),
      error: error instanceof Error ? error.message : null,
      showChurchSwitcher,
      refetch: () => refetch(),
      ensureOrganization,
    }),
    [
      data,
      churches,
      authUser,
      profileReady,
      isLoading,
      error,
      showChurchSwitcher,
      refetch,
      ensureOrganization,
    ]
  );

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = React.useContext(OrganizationContext);
  if (!context) {
    throw new Error("useOrganization must be used within OrganizationProvider");
  }
  return context;
}

export function useOrganizationOptional() {
  return React.useContext(OrganizationContext);
}
