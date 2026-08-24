"use client";

import { useMemo } from "react";

import type { TenantScope } from "@/lib/organization/tenant-scope";
import { isWorkspaceTenantScopeComplete } from "@/lib/tenant-query-builder";
import {
  resolveEffectiveBranchId,
  resolveEffectiveChurchId,
} from "@/lib/organization/resolve-effective-church";

import { useActiveBranchOptional } from "@/context/active-branch-context";
import { useActiveChurch } from "@/context/active-church-context";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useOrganizationOptional } from "@/context/organization-context";
import {
  useAdminChurchId,
  useIsPlatformSuperAdmin,
} from "@/hooks/use-admin-church-id";

export type WorkspaceTenantScopeState = TenantScope & {
  defaultBranchId: string | null;
  isComplete: boolean;
  blocked: boolean;
};

/**
 * Full workspace tenant scope for content queries and writes.
 * Requires organizationId, churchId, and active branchId.
 */
export function useWorkspaceTenantScope(): WorkspaceTenantScopeState {
  const { profile } = useFirebaseAuth();
  const organization = useOrganizationOptional();
  const churchIdFromHook = useAdminChurchId();
  const { activeChurchId } = useActiveChurch();
  const activeBranch = useActiveBranchOptional();
  const isSuperAdmin = useIsPlatformSuperAdmin();

  return useMemo(() => {
    const organizationId =
      organization?.organization?.id?.trim() ||
      profile?.organizationId?.trim() ||
      "";

    const resolvedChurchId = resolveEffectiveChurchId({
      profile,
      activeChurchId: churchIdFromHook || activeChurchId,
      orgChurches: organization?.churches,
    });

    const branchId = resolveEffectiveBranchId({
      profile,
      activeBranchId: activeBranch?.activeBranchId,
      churchId: resolvedChurchId,
      branchesByChurch: organization?.branchesByChurch,
      churches: organization?.churches,
    });

    const branches =
      resolvedChurchId ?
        (organization?.branchesByChurch[resolvedChurchId] ??
          activeBranch?.branches ??
          [])
      : [];

    const defaultBranchId =
      branches.find((branch) => branch.isDefault)?.id ??
      branches[0]?.id ??
      (branchId || null);

    const scope: TenantScope = {
      organizationId,
      churchId: resolvedChurchId,
      branchId: branchId || undefined,
    };

    const isComplete = isWorkspaceTenantScopeComplete(scope);
    const blocked = !isSuperAdmin && !isComplete;

    return {
      ...scope,
      defaultBranchId,
      isComplete,
      blocked,
    };
  }, [
    organization?.organization?.id,
    organization?.churches,
    organization?.branchesByChurch,
    profile,
    churchIdFromHook,
    activeChurchId,
    activeBranch?.activeBranchId,
    activeBranch?.branches,
    isSuperAdmin,
  ]);
}

/**
 * Tenant scope for all content reads (workspace + public while authenticated).
 * Falls back to active church + default branch for anonymous public browsing.
 */
export function useContentTenantScope(): WorkspaceTenantScopeState & {
  isLoading: boolean;
} {
  const workspace = useWorkspaceTenantScope();
  const organization = useOrganizationOptional();
  const { activeChurch, activeChurchId } = useActiveChurch();
  const activeBranch = useActiveBranchOptional();
  const { profile, loading: authLoading } = useFirebaseAuth();
  const isSuperAdmin = useIsPlatformSuperAdmin();

  return useMemo(() => {
    if (workspace.isComplete) {
      return { ...workspace, isLoading: false };
    }

    const churchId = resolveEffectiveChurchId({
      profile,
      activeChurchId: workspace.churchId || activeChurchId,
      orgChurches: organization?.churches,
    });

    const churchFromOrg =
      organization?.churches.find((church) => church.id === churchId) ??
      activeChurch;

    const organizationId =
      workspace.organizationId?.trim() ||
      profile?.organizationId?.trim() ||
      churchFromOrg?.organizationId?.trim() ||
      "";

    const branchId = resolveEffectiveBranchId({
      profile,
      activeBranchId:
        workspace.branchId || activeBranch?.activeBranchId || null,
      churchId,
      branchesByChurch: organization?.branchesByChurch,
      churches: organization?.churches,
    });

    const branches =
      churchId ?
        (organization?.branchesByChurch[churchId] ?? activeBranch?.branches ?? [])
      : [];

    const defaultBranchId =
      churchFromOrg?.defaultBranchId?.trim() ||
      branches.find((branch) => branch.isDefault)?.id ||
      branches[0]?.id ||
      null;

    const scope: TenantScope = {
      organizationId,
      churchId,
      branchId: branchId || undefined,
    };

    const isComplete = isWorkspaceTenantScopeComplete(scope);
    const blocked = !isSuperAdmin && !isComplete;
    const orgReady = !organization?.loading || Boolean(organizationId);
    const resolving = authLoading || (!orgReady && Boolean(profile));

    return {
      ...scope,
      defaultBranchId,
      isComplete,
      blocked,
      isLoading: resolving && !isComplete && !blocked,
    };
  }, [
    workspace,
    organization?.churches,
    organization?.branchesByChurch,
    organization?.loading,
    activeChurch,
    activeChurchId,
    activeBranch?.activeBranchId,
    activeBranch?.branches,
    profile,
    authLoading,
    isSuperAdmin,
  ]);
}

export function useTenantMatchOptions() {
  const scope = useContentTenantScope();

  return useMemo(
    () => ({
      allowLegacyBranchless: true,
      defaultBranchId: scope.defaultBranchId,
    }),
    [scope.defaultBranchId]
  );
}
