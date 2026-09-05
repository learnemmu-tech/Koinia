import "server-only";

import type { TenantContentFields, TenantScope } from "./tenant-scope";
import { buildTenantContentFields } from "./tenant-scope";
import { getChurchRowById, getChurchIdsForOrganization } from "@/lib/postgres/tenants";

export async function resolveTenantScopeForChurch(
  churchId: string,
  options?: { branchId?: string; organizationIdFallback?: string }
): Promise<TenantScope> {
  const trimmedChurchId = churchId.trim();
  let organizationId = options?.organizationIdFallback?.trim() || "";

  if (trimmedChurchId) {
    const church = await getChurchRowById(trimmedChurchId);
    if (church) {
      organizationId = church.organizationId;
    }
  }

  return {
    organizationId,
    churchId: trimmedChurchId,
    branchId: options?.branchId?.trim() || trimmedChurchId || undefined,
  };
}

export async function mergeTenantFieldsIntoPayload<
  T extends Record<string, unknown>,
>(
  payload: T,
  churchId: string,
  options?: { branchId?: string; organizationIdFallback?: string }
): Promise<T & TenantContentFields> {
  const scope = await resolveTenantScopeForChurch(churchId, options);
  return {
    ...payload,
    ...buildTenantContentFields(scope),
  };
}

export { getChurchIdsForOrganization };
