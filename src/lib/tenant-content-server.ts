import "server-only";

import {
  collection,
  getDocs,
  orderBy,
  type QueryConstraint,
} from "firebase/firestore";

import type {
  TenantMatchOptions,
  TenantScope,
} from "@/lib/organization/tenant-scope";
import { filterRecordsByTenant } from "@/lib/organization/tenant-scope";
import { getAdminDb } from "@/lib/firebase-admin";
import { db } from "@/lib/firebase";
import { isRecoverableAdminError, wrapFirebaseError } from "@/lib/firebase-utils";
import {
  buildAdminWorkspaceChurchTenantQuery,
  buildWorkspaceChurchTenantQuery,
  isWorkspaceTenantScopeComplete,
} from "@/lib/tenant-query-builder";

export type TenantFetchOptions = TenantMatchOptions & {
  orderField?: string;
  orderDirection?: "asc" | "desc";
  extraConstraints?: QueryConstraint[];
};

export async function fetchTenantCollection<
  T extends {
    organizationId?: string;
    churchId?: string;
    branchId?: string | null;
  },
>(
  collectionName: string,
  scope: Partial<TenantScope>,
  normalize: (id: string, data: Record<string, unknown>) => T,
  options: TenantFetchOptions = {}
): Promise<T[]> {
  const {
    orderField = "createdAt",
    orderDirection = "desc",
    extraConstraints = [],
    allowLegacyBranchless = true,
    defaultBranchId,
  } = options;

  if (!scope.organizationId?.trim() || !scope.churchId?.trim()) {
    return [];
  }

  const matchOptions: TenantMatchOptions = {
    allowLegacyBranchless,
    defaultBranchId: defaultBranchId ?? scope.branchId ?? null,
  };

  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      const adminQuery = buildAdminWorkspaceChurchTenantQuery(
        adminDb,
        collectionName,
        scope,
        orderField,
        orderDirection
      );

      if (!adminQuery) return [];

      const snapshot = await adminQuery.get();
      return filterRecordsByTenant(
        snapshot.docs.map((docSnap) =>
          normalize(docSnap.id, docSnap.data() as Record<string, unknown>)
        ),
        scope,
        matchOptions
      );
    } catch (error) {
      if (!isRecoverableAdminError(error)) {
        wrapFirebaseError(error);
      }
    }
  }

  try {
    const clientQuery = buildWorkspaceChurchTenantQuery(
      collection(db, collectionName),
      scope,
      orderBy(orderField, orderDirection),
      ...extraConstraints
    );

    if (!clientQuery) return [];

    const snapshot = await getDocs(clientQuery);
    return filterRecordsByTenant(
      snapshot.docs.map((docSnap) =>
        normalize(docSnap.id, docSnap.data() as Record<string, unknown>)
      ),
      scope,
      matchOptions
    );
  } catch (error) {
    wrapFirebaseError(error);
    return [];
  }
}

export function assertTenantScopeForWrite(
  scope: Partial<TenantScope>
): asserts scope is Required<TenantScope> {
  if (!isWorkspaceTenantScopeComplete(scope)) {
    throw new Error(
      "Tenant scope incomplete: organizationId, churchId, and branchId are required."
    );
  }
}
