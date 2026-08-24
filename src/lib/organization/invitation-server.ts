import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import type { CreateInvitationInput, FirebaseInvitation } from "@/types/invitation";
import type { MembershipRole } from "@/types/membership";

import { getAdminDb } from "@/lib/firebase-admin";

import {
  buildInvitationCreatePayload,
  INVITATIONS_COLLECTION,
  isInvitationExpired,
  normalizeInvitationFromFirestore,
} from "./invitation-firestore";
import {
  buildBranchMembershipCreatePayload,
  BRANCH_MEMBERSHIPS_COLLECTION,
  resolveBranchMembershipDocumentId,
} from "./branch-membership-firestore";
import {
  buildMembershipCreatePayload,
  MEMBERSHIPS_COLLECTION,
  resolveMembershipDocumentId,
} from "./membership-firestore";
import { getMembershipForUser } from "./organization-server";
import { roleMeetsMinimum } from "@/types/membership";

export async function createInvitation(
  input: CreateInvitationInput
): Promise<FirebaseInvitation> {
  const adminDb = getAdminDb();
  if (!adminDb) throw new Error("Admin database unavailable");

  const inviterMembership = await getMembershipForUser(
    input.organizationId,
    input.invitedBy
  );
  if (
    !inviterMembership ||
    inviterMembership.status !== "active" ||
    !roleMeetsMinimum(inviterMembership.role, "church_admin")
  ) {
    throw new Error("You do not have permission to send invitations");
  }

  const payload = buildInvitationCreatePayload(input);
  const docRef = await adminDb.collection(INVITATIONS_COLLECTION).add({
    ...payload,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const snap = await docRef.get();
  return normalizeInvitationFromFirestore(
    snap.id,
    snap.data() as Record<string, unknown>
  );
}

export async function getInvitationByToken(
  token: string
): Promise<FirebaseInvitation | null> {
  const adminDb = getAdminDb();
  if (!adminDb || !token.trim()) return null;

  const snap = await adminDb
    .collection(INVITATIONS_COLLECTION)
    .where("token", "==", token.trim())
    .limit(1)
    .get();

  const doc = snap.docs[0];
  if (!doc) return null;

  const invitation = normalizeInvitationFromFirestore(
    doc.id,
    doc.data() as Record<string, unknown>
  );

  if (isInvitationExpired(invitation)) {
    if (invitation.status === "pending") {
      await doc.ref.update({
        status: "expired",
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    return { ...invitation, status: "expired" };
  }

  return invitation;
}

export async function listInvitationsForOrganization(
  organizationId: string
): Promise<FirebaseInvitation[]> {
  const adminDb = getAdminDb();
  if (!adminDb) return [];

  const snap = await adminDb
    .collection(INVITATIONS_COLLECTION)
    .where("organizationId", "==", organizationId)
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();

  return snap.docs.map((doc) =>
    normalizeInvitationFromFirestore(doc.id, doc.data() as Record<string, unknown>)
  );
}

export async function revokeInvitation(
  invitationId: string,
  organizationId: string
): Promise<void> {
  const adminDb = getAdminDb();
  if (!adminDb) throw new Error("Admin database unavailable");

  const ref = adminDb.collection(INVITATIONS_COLLECTION).doc(invitationId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Invitation not found");

  const data = snap.data() as Record<string, unknown>;
  if (String(data.organizationId) !== organizationId) {
    throw new Error("Invitation does not belong to this organization");
  }

  await ref.update({
    status: "revoked",
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function acceptInvitation(
  token: string,
  userId: string,
  userEmail?: string | null
): Promise<{ organizationId: string; churchId: string; branchId: string }> {
  const adminDb = getAdminDb();
  if (!adminDb) throw new Error("Admin database unavailable");

  const invitation = await getInvitationByToken(token);
  if (!invitation) throw new Error("Invitation not found");
  if (invitation.status !== "pending") {
    throw new Error(`Invitation is ${invitation.status}`);
  }

  if (
    invitation.email &&
    userEmail &&
    invitation.email.toLowerCase() !== userEmail.trim().toLowerCase()
  ) {
    throw new Error("This invitation was sent to a different email address");
  }

  const existingOrgMemberships = await adminDb
    .collection(MEMBERSHIPS_COLLECTION)
    .where("userId", "==", userId)
    .where("status", "==", "active")
    .get();

  const otherOrg = existingOrgMemberships.docs.find(
    (doc) => String(doc.data().organizationId) !== invitation.organizationId
  );
  if (otherOrg) {
    throw new Error("You already belong to another organization");
  }

  await adminDb.runTransaction(async (transaction) => {
    const invitationRef = adminDb
      .collection(INVITATIONS_COLLECTION)
      .doc(invitation.id);
    const orgMembershipRef = adminDb
      .collection(MEMBERSHIPS_COLLECTION)
      .doc(
        resolveMembershipDocumentId(invitation.organizationId, userId)
      );
    const branchMembershipRef = adminDb
      .collection(BRANCH_MEMBERSHIPS_COLLECTION)
      .doc(
        resolveBranchMembershipDocumentId(invitation.branchId, userId)
      );

    const orgMembershipSnap = await transaction.get(orgMembershipRef);
    if (!orgMembershipSnap.exists) {
      transaction.set(orgMembershipRef, {
        ...buildMembershipCreatePayload({
          organizationId: invitation.organizationId,
          userId,
          role: mapInvitationRoleToOrgRole(invitation.role),
        }),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    transaction.set(
      branchMembershipRef,
      {
        ...buildBranchMembershipCreatePayload({
          organizationId: invitation.organizationId,
          churchId: invitation.churchId,
          branchId: invitation.branchId,
          userId,
          role: invitation.role,
          status: "active",
        }),
        status: "active",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    transaction.update(invitationRef, {
      status: "accepted",
      acceptedAt: FieldValue.serverTimestamp(),
      acceptedBy: userId,
      updatedAt: FieldValue.serverTimestamp(),
    });

    transaction.set(
      adminDb.collection("users").doc(userId),
      {
        organizationId: invitation.organizationId,
        churchId: invitation.churchId,
        activeBranchId: invitation.branchId,
        pendingBranchId: FieldValue.delete(),
        needsChurchOnboarding: false,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

  return {
    organizationId: invitation.organizationId,
    churchId: invitation.churchId,
    branchId: invitation.branchId,
  };
}

function mapInvitationRoleToOrgRole(role: MembershipRole): MembershipRole {
  if (role === "owner" || role === "org_admin") return role;
  if (role === "church_admin" || role === "branch_admin") return "member";
  return "member";
}
