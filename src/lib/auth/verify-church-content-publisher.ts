import "server-only";

import type { FirebaseMembership } from "@/types/membership";
import type { FirebaseBranchMembership } from "@/types/branch-membership";

import { isPlatformSuperAdmin } from "@/lib/church-access";
import { getAdminDb } from "@/lib/firebase-admin";
import type { FirestoreUser } from "@/lib/firebase-auth-service";
import { canAccessChurchManagement, resolvePrimaryBranchMembership } from "@/lib/auth/workspace-access";

export async function verifyChurchContentPublisher(
  uid: string,
  email: string | undefined
): Promise<boolean> {
  if (isPlatformSuperAdmin(email)) return true;

  const adminDb = getAdminDb();
  if (!adminDb) return false;

  const userSnap = await adminDb.collection("users").doc(uid).get();
  if (!userSnap.exists) return false;

  const data = userSnap.data() as Record<string, unknown>;
  const profile: FirestoreUser = {
    firstName: String(data.firstName ?? ""),
    lastName: String(data.lastName ?? ""),
    email: String(data.email ?? ""),
    role: (data.role as FirestoreUser["role"]) ?? "user",
    organizationId: data.organizationId ? String(data.organizationId) : undefined,
    needsChurchOnboarding: data.needsChurchOnboarding === true,
    churchId: data.churchId ? String(data.churchId) : undefined,
    activeBranchId: data.activeBranchId ? String(data.activeBranchId) : undefined,
    pendingBranchId: data.pendingBranchId ? String(data.pendingBranchId) : undefined,
    churchRole: data.churchRole as FirestoreUser["churchRole"],
    managedChurchIds: Array.isArray(data.managedChurchIds)
      ? data.managedChurchIds.map(String)
      : undefined,
    createdAt: data.createdAt,
  };

  let membership: FirebaseMembership | null = null;
  if (profile.organizationId) {
    const memSnap = await adminDb
      .collection("memberships")
      .doc(`${profile.organizationId}_${uid}`)
      .get();
    if (memSnap.exists) {
      const mem = memSnap.data()!;
      membership = {
        id: memSnap.id,
        organizationId: String(mem.organizationId ?? ""),
        userId: String(mem.userId ?? uid),
        role: mem.role as FirebaseMembership["role"],
        status: mem.status as FirebaseMembership["status"],
        createdAt: Number(mem.createdAt ?? 0),
        updatedAt: Number(mem.updatedAt ?? 0),
      };
    }
  }

  let branchMemberships: FirebaseBranchMembership[] = [];
  if (profile.organizationId) {
    const bmSnap = await adminDb
      .collection("branchMemberships")
      .where("userId", "==", uid)
      .where("status", "==", "active")
      .get();
    branchMemberships = bmSnap.docs.map((docSnap) => {
      const bm = docSnap.data();
      return {
        id: docSnap.id,
        organizationId: String(bm.organizationId ?? ""),
        branchId: String(bm.branchId ?? ""),
        churchId: String(bm.churchId ?? ""),
        userId: String(bm.userId ?? uid),
        role: bm.role as FirebaseBranchMembership["role"],
        status: bm.status as FirebaseBranchMembership["status"],
        createdAt: Number(bm.createdAt ?? 0),
        updatedAt: Number(bm.updatedAt ?? 0),
      };
    });
  }

  const branchMembership = resolvePrimaryBranchMembership(
    profile,
    branchMemberships
  );

  return canAccessChurchManagement({
    profile,
    membership,
    branchMembership,
    churchesCount: profile.churchId ? 1 : 0,
  });
}
