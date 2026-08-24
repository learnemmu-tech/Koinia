import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

import { getAdminDb } from "@/lib/firebase-admin";
import {
  getJoinBlockedReason,
  isPublicJoinAllowed,
  resolveBranchEnrollmentSettings,
} from "@/lib/enrollment";
import type { EnrollmentMode } from "@/types/enrollment";

import {
  buildBranchMembershipCreatePayload,
  BRANCH_MEMBERSHIPS_COLLECTION,
  normalizeBranchMembershipFromFirestore,
  resolveBranchMembershipDocumentId,
} from "./branch-membership-firestore";
import { BRANCHES_COLLECTION, normalizeBranchFromFirestore } from "./branch-firestore";
import { CHURCHES_COLLECTION, normalizeChurchFromFirestore } from "@/lib/church-firestore";
import { DEFAULT_CHURCH_LOGO } from "./onboarding-constants";
import { triggerJoinRequestNotification } from "@/lib/email/triggers";

export type PublicChurchJoinInfo = {
  branchId: string;
  churchId: string;
  organizationId: string;
  name: string;
  slug: string;
  country?: string;
  logoUrl?: string;
  welcomeMessage?: string;
  enrollmentMode: EnrollmentMode;
  joinUrlEnabled: boolean;
  joinAvailable: boolean;
  joinBlockedReason?: string;
  /** active = current slug; retired = invalidated after regeneration */
  slugStatus?: "active" | "retired";
};

export type PendingJoinRequest = {
  churchName: string;
  slug: string;
  branchId: string;
  status: "pending" | "active";
};

export type JoinChurchResult = {
  churchName: string;
  status: "active" | "pending";
};

async function loadBranchBySlug(slug: string) {
  const adminDb = getAdminDb();
  if (!adminDb) return null;

  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  const snap = await adminDb
    .collection(BRANCHES_COLLECTION)
    .where("slug", "==", normalized)
    .where("isActive", "==", true)
    .limit(1)
    .get();

  const doc = snap.docs[0];
  if (!doc) return null;

  return normalizeBranchFromFirestore(doc.id, doc.data() as Record<string, unknown>);
}

async function loadBranchByRetiredSlug(slug: string) {
  const adminDb = getAdminDb();
  if (!adminDb) return null;

  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  const snap = await adminDb
    .collection(BRANCHES_COLLECTION)
    .where("retiredJoinSlugs", "array-contains", normalized)
    .where("isActive", "==", true)
    .limit(1)
    .get();

  const doc = snap.docs[0];
  if (!doc) return null;

  return normalizeBranchFromFirestore(doc.id, doc.data() as Record<string, unknown>);
}

export async function getChurchByJoinSlug(
  slug: string
): Promise<PublicChurchJoinInfo | null> {
  const adminDb = getAdminDb();
  if (!adminDb) return null;

  let branch = await loadBranchBySlug(slug);
  let slugStatus: "active" | "retired" = "active";

  if (!branch) {
    branch = await loadBranchByRetiredSlug(slug);
    if (!branch) return null;
    slugStatus = "retired";
  }

  const enrollment = resolveBranchEnrollmentSettings(branch.settings);
  const blockedReason = getJoinBlockedReason(branch.settings);

  let logoUrl = DEFAULT_CHURCH_LOGO;
  let welcomeMessage: string | undefined;

  const churchSnap = await adminDb
    .collection(CHURCHES_COLLECTION)
    .doc(branch.churchId)
    .get();

  if (churchSnap.exists) {
    const church = normalizeChurchFromFirestore(
      churchSnap.id,
      churchSnap.data() as Record<string, unknown>
    );
    logoUrl = church.logoUrl?.trim() || church.coverImage?.trim() || logoUrl;
    welcomeMessage = church.welcomeMessage?.trim() || undefined;
  }

  const joinAvailable =
    slugStatus === "active" && isPublicJoinAllowed(branch.settings);

  return {
    branchId: branch.id,
    churchId: branch.churchId,
    organizationId: branch.organizationId,
    name: branch.name,
    slug: slug.trim().toLowerCase(),
    country: branch.country?.trim() || undefined,
    logoUrl,
    welcomeMessage,
    enrollmentMode: enrollment.enrollmentMode,
    joinUrlEnabled: enrollment.joinUrlEnabled,
    joinAvailable,
    joinBlockedReason:
      slugStatus === "retired" ?
        "This invitation link is no longer valid."
      : blockedReason ?? undefined,
    slugStatus,
  };
}

export async function joinUserToChurchBySlug(
  userId: string,
  slug: string,
  options?: { emailVerified?: boolean }
): Promise<JoinChurchResult> {
  const adminDb = getAdminDb();
  if (!adminDb) throw new Error("Admin database unavailable");

  const branch = await loadBranchBySlug(slug);
  if (!branch) {
    throw new Error("Church not found");
  }

  if (!isPublicJoinAllowed(branch.settings)) {
    throw new Error(
      getJoinBlockedReason(branch.settings) ??
        "This church is not accepting join requests."
    );
  }

  if (options?.emailVerified === false) {
    throw new Error("Please verify your email before joining a church.");
  }

  const church = {
    branchId: branch.id,
    churchId: branch.churchId,
    organizationId: branch.organizationId,
    name: branch.name,
  };

  const enrollment = resolveBranchEnrollmentSettings(branch.settings);
  const targetStatus: "active" | "pending" =
    enrollment.enrollmentMode === "open" ? "active" : "pending";

  const membershipRef = adminDb
    .collection(BRANCH_MEMBERSHIPS_COLLECTION)
    .doc(resolveBranchMembershipDocumentId(church.branchId, userId));

  const existing = await membershipRef.get();
  if (existing.exists) {
    const membership = normalizeBranchMembershipFromFirestore(
      existing.id,
      existing.data() as Record<string, unknown>
    );

    if (membership.status === "active") {
      await adminDb.collection("users").doc(userId).set(
        {
          organizationId: church.organizationId,
          churchId: church.churchId,
          activeBranchId: church.branchId,
          pendingBranchId: FieldValue.delete(),
          needsChurchOnboarding: false,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return { churchName: church.name, status: "active" };
    }

    if (membership.status === "pending") {
      await adminDb.collection("users").doc(userId).set(
        {
          pendingBranchId: church.branchId,
          needsChurchOnboarding: false,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return { churchName: church.name, status: "pending" };
    }

    if (membership.status === "rejected" || membership.status === "removed") {
      // Allow a fresh join request after rejection or removal.
    } else {
      throw new Error("You cannot join this church with your current membership.");
    }
  }

  await membershipRef.set({
    ...buildBranchMembershipCreatePayload({
      organizationId: church.organizationId,
      churchId: church.churchId,
      branchId: church.branchId,
      userId,
      role: "member",
      status: targetStatus,
    }),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  if (targetStatus === "active") {
    await adminDb.collection("users").doc(userId).set(
      {
        organizationId: church.organizationId,
        churchId: church.churchId,
        activeBranchId: church.branchId,
        pendingBranchId: FieldValue.delete(),
        needsChurchOnboarding: false,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return { churchName: church.name, status: "active" };
  }

  await adminDb.collection("users").doc(userId).set(
    {
      pendingBranchId: church.branchId,
      needsChurchOnboarding: false,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  const userRecord = await getAuth().getUser(userId);
  void triggerJoinRequestNotification({
    organizationId: church.organizationId,
    branchId: church.branchId,
    churchName: church.name,
    memberEmail: userRecord.email ?? "",
    memberName: userRecord.displayName ?? "",
    userId,
  });

  return { churchName: church.name, status: "pending" };
}

export async function getPendingJoinRequestForUser(
  userId: string
): Promise<PendingJoinRequest | null> {
  const adminDb = getAdminDb();
  if (!adminDb) return null;

  const userSnap = await adminDb.collection("users").doc(userId).get();
  if (!userSnap.exists) return null;

  const pendingBranchId = String(userSnap.data()?.pendingBranchId ?? "").trim();
  if (!pendingBranchId) return null;

  const branchSnap = await adminDb
    .collection(BRANCHES_COLLECTION)
    .doc(pendingBranchId)
    .get();

  if (!branchSnap.exists) return null;

  const branch = normalizeBranchFromFirestore(
    branchSnap.id,
    branchSnap.data() as Record<string, unknown>
  );

  const membershipRef = adminDb
    .collection(BRANCH_MEMBERSHIPS_COLLECTION)
    .doc(resolveBranchMembershipDocumentId(branch.id, userId));

  const membershipSnap = await membershipRef.get();
  if (!membershipSnap.exists) return null;

  const membership = normalizeBranchMembershipFromFirestore(
    membershipSnap.id,
    membershipSnap.data() as Record<string, unknown>
  );

  if (membership.status === "rejected" || membership.status === "removed") {
    return null;
  }

  const status = membership.status === "active" ? "active" : "pending";

  return {
    churchName: branch.name,
    slug: branch.slug,
    branchId: branch.id,
    status,
  };
}
