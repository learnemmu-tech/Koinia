/**
 * Tenant scoping for Organization → Church → Branch hierarchy.
 * All future features should resolve tenant context through these helpers.
 */

import type { FirebaseBranch } from "@/types/branch";
import type { FirebaseChurch } from "@/types/firebase-church";
import type { FirebaseOrganization } from "@/types/organization";

import { resolveChurchIdForWrite } from "@/lib/church-scope";

export type TenantScope = {
  organizationId: string;
  churchId: string;
  branchId?: string;
};

export type TenantContentFields = {
  organizationId: string;
  churchId: string;
  branchId?: string | null;
};

/** Build fields to stamp on new content documents. */
export function buildTenantContentFields(scope: TenantScope): TenantContentFields {
  return {
    organizationId: scope.organizationId.trim(),
    churchId: resolveChurchIdForWrite(scope.churchId),
    branchId: scope.branchId?.trim() || null,
  };
}

/** Read organizationId / branchId from a Firestore content document. */
export function parseTenantFieldsFromDocument(
  data: Record<string, unknown>
): Pick<TenantContentFields, "organizationId" | "branchId"> {
  return {
    organizationId: String(data.organizationId ?? "").trim(),
    branchId: String(data.branchId ?? "").trim() || null,
  };
}

export function resolveTenantFromChurch(
  church: Pick<FirebaseChurch, "id" | "organizationId">,
  organizationIdFallback?: string
): TenantScope {
  return {
    organizationId:
      church.organizationId?.trim() ||
      organizationIdFallback?.trim() ||
      "",
    churchId: church.id,
  };
}

export function resolveTenantWithBranch(
  church: Pick<FirebaseChurch, "id" | "organizationId">,
  branch: Pick<FirebaseBranch, "id" | "organizationId" | "churchId"> | null,
  organizationIdFallback?: string
): TenantScope {
  const base = resolveTenantFromChurch(church, organizationIdFallback);
  if (!branch) return base;
  return {
    ...base,
    branchId: branch.id,
  };
}

export function resolveOrganizationIdFromDocument(
  data: Record<string, unknown>,
  churchOrganizationId?: string
): string {
  const explicit = String(data.organizationId ?? "").trim();
  if (explicit) return explicit;
  return churchOrganizationId?.trim() || "";
}

export type TenantMatchOptions = {
  /** When true, documents missing branchId match the scope's default branch only. */
  allowLegacyBranchless?: boolean;
  defaultBranchId?: string | null;
};

export function documentBelongsToTenant(
  data: Record<string, unknown>,
  scope: Partial<TenantScope>,
  options?: TenantMatchOptions
): boolean {
  if (scope.organizationId?.trim()) {
    const docOrgId = String(data.organizationId ?? "").trim();
    // Legacy docs may omit organizationId — churchId match is sufficient.
    if (docOrgId && docOrgId !== scope.organizationId.trim()) return false;
  }
  if (scope.churchId?.trim()) {
    const docChurchId = String(data.churchId ?? "").trim();
    if (!docChurchId || docChurchId !== scope.churchId.trim()) return false;
  }
  if (scope.branchId?.trim()) {
    const docBranchId = String(data.branchId ?? "").trim();
    if (docBranchId) {
      return docBranchId === scope.branchId.trim();
    }
    if (options?.allowLegacyBranchless) {
      const fallback = options.defaultBranchId?.trim() || scope.branchId.trim();
      return fallback === scope.branchId.trim();
    }
    return false;
  }
  return true;
}

export function filterRecordsByTenant<
  T extends {
    organizationId?: string;
    churchId?: string;
    branchId?: string | null;
  },
>(
  records: T[],
  scope: Partial<TenantScope>,
  options?: TenantMatchOptions
): T[] {
  if (!scope.organizationId?.trim() && !scope.churchId?.trim()) {
    return [];
  }

  return records.filter((record) =>
    documentBelongsToTenant(
      record as unknown as Record<string, unknown>,
      scope,
      options
    )
  );
}

export function recordMatchesTenantScope<
  T extends {
    organizationId?: string;
    churchId?: string;
    branchId?: string | null;
  },
>(
  record: T | null | undefined,
  scope: Partial<TenantScope>,
  options?: TenantMatchOptions
): record is T {
  if (!record) return false;
  return documentBelongsToTenant(
    record as unknown as Record<string, unknown>,
    scope,
    options
  );
}

export function filterChurchesByOrganization(
  churches: FirebaseChurch[],
  organizationId: string
): FirebaseChurch[] {
  if (!organizationId.trim()) return churches;
  return churches.filter(
    (church) => (church.organizationId ?? "") === organizationId
  );
}

export function organizationOwnsMultipleChurches(
  churches: FirebaseChurch[],
  organizationId: string
): boolean {
  return (
    filterChurchesByOrganization(churches, organizationId).filter((c) => c.isActive)
      .length > 1
  );
}

/** Merge tenant fields into a client-side write payload. */
export function mergeClientTenantFields<T extends Record<string, unknown>>(
  payload: T,
  scope: Partial<TenantScope>
): T & TenantContentFields {
  const churchId = scope.churchId?.trim() || String(payload.churchId ?? "").trim();
  return {
    ...payload,
    ...buildTenantContentFields({
      organizationId: scope.organizationId?.trim() || "",
      churchId,
      branchId: scope.branchId,
    }),
  };
}

export function pickOrganizationSummary(org: FirebaseOrganization) {
  return {
    id: org.id,
    name: org.name,
    logo: org.logo,
    subscriptionPlan: org.subscriptionPlan,
    status: org.status,
  };
}
