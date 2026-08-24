"use client";

import { useOrganizationOptional } from "@/context/organization-context";
import { useActiveBranchOptional } from "@/context/active-branch-context";
import { useAdminChurchId } from "@/hooks/use-admin-church-id";

/** Tenant fields for stamping notifications and client writes. */
export function useTenantNotifyFields() {
  const churchId = useAdminChurchId();
  const organization = useOrganizationOptional();
  const activeBranch = useActiveBranchOptional();

  return {
    churchId: churchId || undefined,
    organizationId: organization?.organization?.id,
    branchId: activeBranch?.activeBranchId ?? undefined,
  };
}
