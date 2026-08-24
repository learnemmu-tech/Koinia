import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import type { FirebaseBranchMembership } from "@/types/branch-membership";
import type { FirebaseMembership } from "@/types/membership";

import { getAdminDb } from "@/lib/firebase-admin";
import { triggerMembershipApprovedNotification } from "@/lib/email/triggers";

import {
  BRANCH_MEMBERSHIPS_COLLECTION,
  normalizeBranchMembershipFromFirestore,
  resolveBranchMembershipDocumentId,
} from "./branch-membership-firestore";
import {
  MEMBERSHIPS_COLLECTION,
  normalizeMembershipFromFirestore,
} from "./membership-firestore";

export async function listOrganizationMemberships(
  organizationId: string
): Promise<FirebaseMembership[]> {
  const adminDb = getAdminDb();
  if (!adminDb) return [];

  const snap = await adminDb
    .collection(MEMBERSHIPS_COLLECTION)
    .where("organizationId", "==", organizationId)
    .get();

  return snap.docs.map((doc) =>
    normalizeMembershipFromFirestore(doc.id, doc.data() as Record<string, unknown>)
  );
}

export async function listBranchMembershipsForOrganization(
  organizationId: string
): Promise<FirebaseBranchMembership[]> {
  const adminDb = getAdminDb();
  if (!adminDb) return [];

  const snap = await adminDb
    .collection(BRANCH_MEMBERSHIPS_COLLECTION)
    .where("organizationId", "==", organizationId)
    .get();

  return snap.docs.map((doc) =>
    normalizeBranchMembershipFromFirestore(
      doc.id,
      doc.data() as Record<string, unknown>
    )
  );
}

export async function getBranchMembershipForUserAndBranch(
  branchId: string,
  userId: string
): Promise<FirebaseBranchMembership | null> {
  const adminDb = getAdminDb();
  if (!adminDb) return null;

  const docId = resolveBranchMembershipDocumentId(branchId, userId);
  const snap = await adminDb
    .collection(BRANCH_MEMBERSHIPS_COLLECTION)
    .doc(docId)
    .get();

  if (!snap.exists) return null;

  return normalizeBranchMembershipFromFirestore(
    snap.id,
    snap.data() as Record<string, unknown>
  );
}

export async function listPendingBranchMemberships(
  organizationId: string,
  branchId: string
): Promise<FirebaseBranchMembership[]> {
  const adminDb = getAdminDb();
  if (!adminDb) return [];

  const snap = await adminDb
    .collection(BRANCH_MEMBERSHIPS_COLLECTION)
    .where("organizationId", "==", organizationId)
    .where("branchId", "==", branchId)
    .where("status", "==", "pending")
    .get();

  return snap.docs.map((doc) =>
    normalizeBranchMembershipFromFirestore(
      doc.id,
      doc.data() as Record<string, unknown>
    )
  );
}

export async function approveBranchMembership(
  membershipId: string,
  _reviewerUserId: string
): Promise<void> {
  const adminDb = getAdminDb();
  if (!adminDb) throw new Error("Admin database unavailable");

  const membershipRef = adminDb
    .collection(BRANCH_MEMBERSHIPS_COLLECTION)
    .doc(membershipId);
  const snap = await membershipRef.get();
  if (!snap.exists) throw new Error("Membership not found");

  const membership = normalizeBranchMembershipFromFirestore(
    snap.id,
    snap.data() as Record<string, unknown>
  );

  await membershipRef.update({
    status: "active",
    updatedAt: FieldValue.serverTimestamp(),
  });

  await adminDb.collection("users").doc(membership.userId).set(
    {
      organizationId: membership.organizationId,
      churchId: membership.churchId,
      activeBranchId: membership.branchId,
      pendingBranchId: FieldValue.delete(),
      needsChurchOnboarding: false,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  await triggerMembershipApprovedNotification({
    userId: membership.userId,
    churchId: membership.churchId,
    organizationId: membership.organizationId,
    branchId: membership.branchId,
  });
}

export async function rejectBranchMembership(
  membershipId: string
): Promise<void> {
  const adminDb = getAdminDb();
  if (!adminDb) throw new Error("Admin database unavailable");

  const membershipRef = adminDb
    .collection(BRANCH_MEMBERSHIPS_COLLECTION)
    .doc(membershipId);
  const snap = await membershipRef.get();
  if (!snap.exists) throw new Error("Membership not found");

  const membership = normalizeBranchMembershipFromFirestore(
    snap.id,
    snap.data() as Record<string, unknown>
  );

  await membershipRef.update({
    status: "rejected",
    updatedAt: FieldValue.serverTimestamp(),
  });

  const userRef = adminDb.collection("users").doc(membership.userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) return;

  const userData = userSnap.data() as Record<string, unknown>;
  const updates: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (String(userData.pendingBranchId ?? "") === membership.branchId) {
    updates.pendingBranchId = FieldValue.delete();
  }
  if (String(userData.activeBranchId ?? "") === membership.branchId) {
    updates.activeBranchId = FieldValue.delete();
    updates.churchId = FieldValue.delete();
  }

  if (Object.keys(updates).length > 1) {
    await userRef.set(updates, { merge: true });
  }
}

export async function removeBranchMembership(
  membershipId: string,
  _removedByUserId: string
): Promise<void> {
  const adminDb = getAdminDb();
  if (!adminDb) throw new Error("Admin database unavailable");

  const membershipRef = adminDb
    .collection(BRANCH_MEMBERSHIPS_COLLECTION)
    .doc(membershipId);
  const snap = await membershipRef.get();
  if (!snap.exists) throw new Error("Membership not found");

  const membership = normalizeBranchMembershipFromFirestore(
    snap.id,
    snap.data() as Record<string, unknown>
  );

  await membershipRef.update({
    status: "removed",
    updatedAt: FieldValue.serverTimestamp(),
  });

  const userRef = adminDb.collection("users").doc(membership.userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) return;

  const userData = userSnap.data() as Record<string, unknown>;
  const updates: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (String(userData.pendingBranchId ?? "") === membership.branchId) {
    updates.pendingBranchId = FieldValue.delete();
  }
  if (String(userData.activeBranchId ?? "") === membership.branchId) {
    updates.activeBranchId = FieldValue.delete();
    updates.churchId = FieldValue.delete();
    if (String(userData.organizationId ?? "") === membership.organizationId) {
      updates.organizationId = FieldValue.delete();
    }
  }

  if (Object.keys(updates).length > 1) {
    await userRef.set(updates, { merge: true });
  }
}

export async function listActiveBranchMemberships(
  organizationId: string,
  branchId: string
): Promise<FirebaseBranchMembership[]> {
  const adminDb = getAdminDb();
  if (!adminDb) return [];

  const snap = await adminDb
    .collection(BRANCH_MEMBERSHIPS_COLLECTION)
    .where("organizationId", "==", organizationId)
    .where("branchId", "==", branchId)
    .where("status", "==", "active")
    .get();

  return snap.docs.map((doc) =>
    normalizeBranchMembershipFromFirestore(
      doc.id,
      doc.data() as Record<string, unknown>
    )
  );
}

export async function bulkReviewBranchMemberships(
  membershipIds: string[],
  action: "approve" | "reject",
  reviewerUserId: string
): Promise<void> {
  for (const membershipId of membershipIds) {
    if (action === "approve") {
      await approveBranchMembership(membershipId, reviewerUserId);
    } else {
      await rejectBranchMembership(membershipId);
    }
  }
}

export async function getBranchMembershipsForUser(
  userId: string
): Promise<FirebaseBranchMembership[]> {
  const adminDb = getAdminDb();
  if (!adminDb) return [];

  const snap = await adminDb
    .collection(BRANCH_MEMBERSHIPS_COLLECTION)
    .where("userId", "==", userId)
    .where("status", "==", "active")
    .get();

  return snap.docs.map((doc) =>
    normalizeBranchMembershipFromFirestore(
      doc.id,
      doc.data() as Record<string, unknown>
    )
  );
}
