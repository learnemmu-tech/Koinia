import "server-only";

import {
  CHURCHES_COLLECTION,
  normalizeChurchFromFirestore,
} from "@/lib/church-firestore";
import { getAdminDb } from "@/lib/firebase-admin";

import {
  buildTenantContentFields,
  type TenantContentFields,
  type TenantScope,
} from "./tenant-scope";

/** Resolve organization + church (+ optional branch) for server writes. */
export async function resolveTenantScopeForChurch(
  churchId: string,
  options?: { branchId?: string; organizationIdFallback?: string }
): Promise<TenantScope> {
  const trimmedChurchId = churchId.trim();
  let organizationId = options?.organizationIdFallback?.trim() || "";

  const adminDb = getAdminDb();
  let branchId = options?.branchId?.trim() || "";

  if (adminDb && trimmedChurchId) {
    const snap = await adminDb
      .collection(CHURCHES_COLLECTION)
      .doc(trimmedChurchId)
      .get();

    if (snap.exists) {
      const church = normalizeChurchFromFirestore(
        snap.id,
        snap.data() as Record<string, unknown>
      );
      organizationId = church.organizationId?.trim() || organizationId;
      if (!branchId) {
        branchId = church.defaultBranchId?.trim() || "";
      }
    }
  }

  return {
    organizationId,
    churchId: trimmedChurchId,
    branchId: branchId || undefined,
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

export async function getChurchIdsForOrganization(
  organizationId: string
): Promise<string[]> {
  const adminDb = getAdminDb();
  if (!adminDb || !organizationId.trim()) return [];

  const snap = await adminDb
    .collection(CHURCHES_COLLECTION)
    .where("organizationId", "==", organizationId)
    .get();

  return snap.docs.map((doc) => doc.id);
}
