import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";
import type { FirestoreUser, UserRole } from "@/lib/firebase-auth-service";
import {
  resolveMembershipRouting,
  type MembershipRoutingResult,
} from "@/lib/auth/membership-routing";
import { getWorkspaceType } from "@/lib/organization/workspace-type";
import type { FirebaseBranchMembership } from "@/types/branch-membership";

import {
  BRANCH_MEMBERSHIPS_COLLECTION,
  normalizeBranchMembershipFromFirestore,
} from "@/lib/organization/branch-membership-firestore";
import {
  getMembershipForUser,
  getOrganizationById,
} from "@/lib/organization/organization-server";

export async function listAllBranchMembershipsForUser(
  userId: string
): Promise<FirebaseBranchMembership[]> {
  const adminDb = getAdminDb();
  if (!adminDb) return [];

  const snap = await adminDb
    .collection(BRANCH_MEMBERSHIPS_COLLECTION)
    .where("userId", "==", userId)
    .get();

  return snap.docs.map((doc) =>
    normalizeBranchMembershipFromFirestore(
      doc.id,
      doc.data() as Record<string, unknown>
    )
  );
}

async function loadUserProfile(userId: string): Promise<FirestoreUser | null> {
  const adminDb = getAdminDb();
  if (!adminDb) return null;

  const snap = await adminDb.collection("users").doc(userId).get();
  if (!snap.exists) return null;

  const data = snap.data() as Record<string, unknown>;
  return {
    firstName: String(data.firstName ?? ""),
    lastName: String(data.lastName ?? ""),
    email: String(data.email ?? ""),
    role: (data.role as UserRole) ?? "user",
    churchId: data.churchId ? String(data.churchId) : undefined,
    organizationId: data.organizationId ? String(data.organizationId) : undefined,
    activeBranchId: data.activeBranchId ? String(data.activeBranchId) : undefined,
    pendingBranchId: data.pendingBranchId ? String(data.pendingBranchId) : undefined,
    needsChurchOnboarding: data.needsChurchOnboarding === true,
    createdAt: data.createdAt,
  };
}

async function countOrganizationChurches(organizationId: string): Promise<number> {
  const adminDb = getAdminDb();
  if (!adminDb || !organizationId) return 0;

  const snap = await adminDb
    .collection("churches")
    .where("organizationId", "==", organizationId)
    .where("isActive", "==", true)
    .get();

  return snap.size;
}

async function countOrganizationBranches(organizationId: string): Promise<number> {
  const adminDb = getAdminDb();
  if (!adminDb || !organizationId) return 0;

  const snap = await adminDb
    .collection("branches")
    .where("organizationId", "==", organizationId)
    .where("isActive", "==", true)
    .get();

  return snap.size;
}

export async function resolveUserMembershipRouting(
  userId: string,
  callbackUrl?: string | null
): Promise<MembershipRoutingResult> {
  const profile = await loadUserProfile(userId);
  const organizationId = profile?.organizationId?.trim() ?? "";

  const [membership, branchMemberships, churchesCount, branchesCount, organization] =
    await Promise.all([
      organizationId ?
        getMembershipForUser(organizationId, userId)
      : Promise.resolve(null),
      listAllBranchMembershipsForUser(userId),
      organizationId ?
        countOrganizationChurches(organizationId)
      : Promise.resolve(0),
      organizationId ?
        countOrganizationBranches(organizationId)
      : Promise.resolve(0),
      organizationId ?
        getOrganizationById(organizationId)
      : Promise.resolve(null),
    ]);

  const workspaceType = getWorkspaceType(organization);

  return resolveMembershipRouting({
    profile,
    membership,
    branchMemberships,
    churchesCount,
    branchesCount,
    workspaceType,
    callbackUrl,
  });
}
