"use client";

import { useMemo } from "react";

import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useOrganization } from "@/context/organization-context";
import { getWorkspaceType } from "@/lib/organization/workspace-type";
import type { WorkspaceAccessInput } from "@/lib/auth/workspace-access";
import {
  canAccessWorkspace,
  isOnboardingComplete,
  needsChurchOnboarding,
  isMembershipPending,
  resolveAccountType,
} from "@/lib/auth/workspace-access";

export function useWorkspaceAccess() {
  const { profile, loading: authLoading, profileReady } = useFirebaseAuth();
  const { membership, churches, branchesByChurch, organization, loading: orgLoading } =
    useOrganization();

  const branchesCount = useMemo(
    () => Object.values(branchesByChurch).flat().length,
    [branchesByChurch]
  );

  const workspaceType = getWorkspaceType(organization);

  const input: WorkspaceAccessInput = useMemo(
    () => ({
      profile,
      membership,
      churchesCount: churches.length,
      branchesCount,
      workspaceType,
    }),
    [profile, membership, churches.length, branchesCount, workspaceType]
  );

  const profileOnboardingComplete = Boolean(
    profile &&
      profile.needsChurchOnboarding !== true &&
      (profile.churchId?.trim() ||
        profile.activeBranchId?.trim() ||
        profile.organizationId?.trim())
  );

  const canAccessFromProfileOnly = canAccessWorkspace({
    profile,
    membership: null,
    churchesCount: churches.length,
    branchesCount,
    workspaceType,
  });

  const loading =
    authLoading ||
    !profileReady ||
    (Boolean(profile) &&
      orgLoading &&
      !profileOnboardingComplete &&
      !canAccessFromProfileOnly);

  return {
    loading,
    input,
    canAccessWorkspace: canAccessWorkspace(input),
    isOnboardingComplete: isOnboardingComplete(input),
    needsChurchOnboarding: needsChurchOnboarding(input),
    isMembershipPending: isMembershipPending(profile),
    accountType: resolveAccountType(input),
  };
}
