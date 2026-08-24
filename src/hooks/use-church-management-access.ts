"use client";

import { useMemo } from "react";

import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useOrganization } from "@/context/organization-context";
import { getWorkspaceType } from "@/lib/organization/workspace-type";
import {
  canAccessChurchManagement,
  resolvePrimaryBranchMembership,
  type WorkspaceAccessInput,
} from "@/lib/auth/workspace-access";

export function useChurchManagementAccess() {
  const { profile, loading: authLoading } = useFirebaseAuth();
  const {
    membership,
    branchMembership: contextBranchMembership,
    branchMemberships,
    churches,
    organization,
    loading: orgLoading,
  } = useOrganization();

  const workspaceType = getWorkspaceType(organization);

  const branchMembership = useMemo(() => {
    if (contextBranchMembership) return contextBranchMembership;
    return resolvePrimaryBranchMembership(profile, branchMemberships);
  }, [contextBranchMembership, profile, branchMemberships]);

  const input: WorkspaceAccessInput = useMemo(
    () => ({
      profile,
      membership,
      branchMembership,
      churchesCount: churches.length,
      workspaceType,
    }),
    [profile, membership, branchMembership, churches.length, workspaceType]
  );

  const needsOrgContext = Boolean(
    profile?.organizationId?.trim() ||
      profile?.activeBranchId?.trim() ||
      profile?.churchId?.trim()
  );

  // Show member nav immediately; only gate admin-specific UI on org fetch.
  const loading = authLoading || (needsOrgContext && orgLoading && !profile);

  return {
    loading,
    canAccessChurchManagement: canAccessChurchManagement(input),
  };
}
