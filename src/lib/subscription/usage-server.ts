import "server-only";

import { resolveTenantScopeForChurch } from "@/lib/organization/resolve-tenant-scope";
import { computeOrganizationUsage as computeUsage } from "@/lib/postgres/features";
import type { SubscriptionUsage } from "@/types/subscription";
import { EMPTY_USAGE } from "./limits";

export async function computeOrganizationUsage(
  organizationId: string
): Promise<SubscriptionUsage> {
  if (!organizationId.trim()) return { ...EMPTY_USAGE };
  return computeUsage(organizationId);
}

export async function computeChurchUsage(
  churchId: string
): Promise<SubscriptionUsage> {
  const scope = await resolveTenantScopeForChurch(churchId);
  if (scope.organizationId) {
    return computeOrganizationUsage(scope.organizationId);
  }
  return { ...EMPTY_USAGE };
}
