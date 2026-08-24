"use client";



import { useWorkspaceTenantScope } from "@/hooks/use-workspace-tenant-scope";



/** Resolves full tenant scope for admin content writes. */

export function useAdminTenantScope() {

  const scope = useWorkspaceTenantScope();

  return {

    organizationId: scope.organizationId ?? "",

    churchId: scope.churchId ?? "",

    branchId: scope.branchId ?? "",

    isComplete: scope.isComplete,

    blocked: scope.blocked,

  };

}


