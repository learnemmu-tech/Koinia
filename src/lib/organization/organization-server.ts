import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import type { CreateBranchInput, UpdateBranchInput } from "@/types/branch";
import type { CreateChurchInput } from "@/types/firebase-church";
import type { CreateMembershipInput } from "@/types/membership";
import type { FirebaseBranchMembership } from "@/types/branch-membership";
import type {
  CreateOrganizationInput,
  FirebaseOrganization,
  UpdateOrganizationInput,
} from "@/types/organization";

import {
  buildChurchCreatePayload,
  CHURCHES_COLLECTION,
  normalizeChurchFromFirestore,
} from "@/lib/church-firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { ensureSubscriptionDocument } from "@/lib/subscription/subscription-server";
import type { FirebaseBranch } from "@/types/branch";
import type { FirebaseChurch } from "@/types/firebase-church";
import type { FirebaseMembership } from "@/types/membership";

import {
  buildBranchCreatePayload,
  buildBranchUpdatePayload,
  BRANCHES_COLLECTION,
  normalizeBranchFromFirestore,
} from "./branch-firestore";
import { getBranchMembershipsForUser } from "./branch-membership-server";
import { resolvePrimaryBranchMembership } from "@/lib/auth/workspace-access";
import {
  buildMembershipCreatePayload,
  MEMBERSHIPS_COLLECTION,
  normalizeMembershipFromFirestore,
  resolveMembershipDocumentId,
} from "./membership-firestore";
import {
  buildOrganizationCreatePayload,
  buildOrganizationUpdatePayload,
  normalizeOrganizationFromFirestore,
  ORGANIZATIONS_COLLECTION,
} from "./organization-firestore";

export async function getOrganizationById(
  organizationId: string
): Promise<FirebaseOrganization | null> {
  const adminDb = getAdminDb();
  if (!adminDb || !organizationId.trim()) return null;

  const snap = await adminDb
    .collection(ORGANIZATIONS_COLLECTION)
    .doc(organizationId)
    .get();

  if (!snap.exists) return null;
  return normalizeOrganizationFromFirestore(
    snap.id,
    snap.data() as Record<string, unknown>
  );
}

export async function getOrganizationsForUser(
  userId: string
): Promise<FirebaseOrganization[]> {
  const adminDb = getAdminDb();
  if (!adminDb || !userId.trim()) return [];

  const membershipSnap = await adminDb
    .collection(MEMBERSHIPS_COLLECTION)
    .where("userId", "==", userId)
    .where("status", "==", "active")
    .get();

  const orgIds = [
    ...new Set(
      membershipSnap.docs.map((doc) =>
        String(doc.data().organizationId ?? "").trim()
      )
    ),
  ].filter(Boolean);

  if (orgIds.length === 0) return [];

  const orgs = await Promise.all(orgIds.map((id) => getOrganizationById(id)));
  return orgs.filter((org): org is FirebaseOrganization => org !== null);
}

export async function getMembershipForUser(
  organizationId: string,
  userId: string
): Promise<FirebaseMembership | null> {
  const adminDb = getAdminDb();
  if (!adminDb) return null;

  const docId = resolveMembershipDocumentId(organizationId, userId);
  const snap = await adminDb
    .collection(MEMBERSHIPS_COLLECTION)
    .doc(docId)
    .get();

  if (!snap.exists) return null;
  return normalizeMembershipFromFirestore(
    snap.id,
    snap.data() as Record<string, unknown>
  );
}

export async function getChurchesByOrganization(
  organizationId: string
): Promise<FirebaseChurch[]> {
  const adminDb = getAdminDb();
  if (!adminDb || !organizationId.trim()) return [];

  const snap = await adminDb
    .collection(CHURCHES_COLLECTION)
    .where("organizationId", "==", organizationId)
    .get();

  return snap.docs.map((doc) =>
    normalizeChurchFromFirestore(doc.id, doc.data() as Record<string, unknown>)
  );
}

export async function getBranchesByChurch(
  organizationId: string,
  churchId: string
): Promise<FirebaseBranch[]> {
  const adminDb = getAdminDb();
  if (!adminDb) return [];

  const snap = await adminDb
    .collection(BRANCHES_COLLECTION)
    .where("organizationId", "==", organizationId)
    .where("churchId", "==", churchId)
    .get();

  return snap.docs.map((doc) =>
    normalizeBranchFromFirestore(doc.id, doc.data() as Record<string, unknown>)
  );
}

export async function createOrganization(
  input: CreateOrganizationInput
): Promise<string> {
  const adminDb = getAdminDb();
  if (!adminDb) throw new Error("Admin database unavailable");

  const payload = buildOrganizationCreatePayload(input);
  const orgRef = await adminDb.collection(ORGANIZATIONS_COLLECTION).add({
    ...payload,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const membershipId = resolveMembershipDocumentId(orgRef.id, input.ownerId);
  await adminDb.collection(MEMBERSHIPS_COLLECTION).doc(membershipId).set({
    ...buildMembershipCreatePayload({
      organizationId: orgRef.id,
      userId: input.ownerId,
      role: "owner",
    }),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await ensureSubscriptionDocument(orgRef.id);

  return orgRef.id;
}

export async function updateOrganization(
  organizationId: string,
  input: UpdateOrganizationInput
): Promise<void> {
  const adminDb = getAdminDb();
  if (!adminDb) throw new Error("Admin database unavailable");

  const payload = buildOrganizationUpdatePayload(input);
  if (Object.keys(payload).length === 0) return;

  await adminDb
    .collection(ORGANIZATIONS_COLLECTION)
    .doc(organizationId)
    .update({
      ...payload,
      updatedAt: FieldValue.serverTimestamp(),
    });
}

export async function createChurchInOrganization(
  organizationId: string,
  input: CreateChurchInput,
  creatorUserId?: string
): Promise<{ churchId: string; branchId: string }> {
  const { createChurchWithDefaultBranch } = await import("./onboarding-server");
  return createChurchWithDefaultBranch(
    organizationId,
    input,
    creatorUserId
  );
}

export async function deleteChurchInOrganization(
  organizationId: string,
  churchId: string
): Promise<void> {
  const adminDb = getAdminDb();
  if (!adminDb) throw new Error("Admin database unavailable");

  const churchSnap = await adminDb
    .collection(CHURCHES_COLLECTION)
    .doc(churchId)
    .get();

  if (!churchSnap.exists) throw new Error("Church not found");

  const church = normalizeChurchFromFirestore(
    churchSnap.id,
    churchSnap.data() as Record<string, unknown>
  );

  if (church.organizationId && church.organizationId !== organizationId) {
    throw new Error("Church does not belong to this organization");
  }

  await adminDb.collection(CHURCHES_COLLECTION).doc(churchId).delete();
}

export async function createBranch(
  input: CreateBranchInput
): Promise<string> {
  const adminDb = getAdminDb();
  if (!adminDb) throw new Error("Admin database unavailable");

  const payload = buildBranchCreatePayload({
    ...input,
    isDefault: input.isDefault === true,
  });
  const docRef = await adminDb.collection(BRANCHES_COLLECTION).add({
    ...payload,
    isDefault: input.isDefault === true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return docRef.id;
}

export async function updateBranch(
  branchId: string,
  input: UpdateBranchInput
): Promise<void> {
  const adminDb = getAdminDb();
  if (!adminDb) throw new Error("Admin database unavailable");

  const payload = buildBranchUpdatePayload(input);
  if (Object.keys(payload).length === 0) return;

  await adminDb.collection(BRANCHES_COLLECTION).doc(branchId).update({
    ...payload,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function deleteBranch(branchId: string): Promise<void> {
  const adminDb = getAdminDb();
  if (!adminDb) throw new Error("Admin database unavailable");

  const snap = await adminDb.collection(BRANCHES_COLLECTION).doc(branchId).get();
  if (!snap.exists) throw new Error("Branch not found");

  const data = snap.data() as Record<string, unknown>;
  if (data.isDefault === true) {
    throw new Error("Cannot delete the default Main Branch");
  }

  await adminDb.collection(BRANCHES_COLLECTION).doc(branchId).delete();
}

export async function ensureOrganizationForUser(
  userId: string,
  defaultName = "My Organization"
): Promise<FirebaseOrganization> {
  const existing = await getOrganizationsForUser(userId);
  if (existing[0]) return existing[0];

  const orgId = await createOrganization({
    name: defaultName,
    ownerId: userId,
  });

  const org = await getOrganizationById(orgId);
  if (!org) throw new Error("Failed to create organization");
  return org;
}

export type OrganizationSnapshot = {
  organization: FirebaseOrganization;
  membership: FirebaseMembership | null;
  branchMembership: FirebaseBranchMembership | null;
  branchMemberships: FirebaseBranchMembership[];
  churches: FirebaseChurch[];
  branchesByChurch: Record<string, FirebaseBranch[]>;
  userProfile?: {
    activeBranchId?: string;
    churchId?: string;
  };
};

export async function getOrganizationSnapshot(
  organizationId: string,
  userId: string
): Promise<OrganizationSnapshot | null> {
  const organization = await getOrganizationById(organizationId);
  if (!organization) return null;

  const adminDb = getAdminDb();
  let userProfile: OrganizationSnapshot["userProfile"];
  if (adminDb) {
    const userSnap = await adminDb.collection("users").doc(userId).get();
    if (userSnap.exists) {
      const data = userSnap.data() as Record<string, unknown>;
      userProfile = {
        activeBranchId: data.activeBranchId ?
          String(data.activeBranchId)
        : undefined,
        churchId: data.churchId ? String(data.churchId) : undefined,
      };
    }
  }

  const [membership, churches, branchMembershipsAll] = await Promise.all([
    getMembershipForUser(organizationId, userId),
    getChurchesByOrganization(organizationId),
    getBranchMembershipsForUser(userId),
  ]);

  const branchMemberships = branchMembershipsAll.filter(
    (m) => m.organizationId === organizationId
  );

  const branchMembership = resolvePrimaryBranchMembership(
    userProfile ?
      {
        firstName: "",
        lastName: "",
        email: "",
        role: "user",
        activeBranchId: userProfile.activeBranchId,
        churchId: userProfile.churchId,
        createdAt: null,
      }
    : null,
    branchMemberships
  );

  const branchesByChurch: Record<string, FirebaseBranch[]> = {};
  await Promise.all(
    churches.map(async (church) => {
      branchesByChurch[church.id] = await getBranchesByChurch(
        organizationId,
        church.id
      );
    })
  );

  return {
    organization,
    membership,
    branchMembership,
    branchMemberships,
    churches,
    branchesByChurch,
    userProfile,
  };
}
