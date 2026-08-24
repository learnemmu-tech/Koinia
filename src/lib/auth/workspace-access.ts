import type { FirestoreUser } from "@/lib/firebase-auth-service";
import type { FirebaseBranchMembership } from "@/types/branch-membership";
import type { FirebaseMembership, MembershipRole } from "@/types/membership";
import { roleMeetsMinimum } from "@/types/membership";

import { isPlatformSuperAdmin } from "@/lib/church-access";

import { resolveAccountType as resolveAccountTypeInternal } from "./account-type";

export type WorkspaceAccessInput = {
  profile: FirestoreUser | null;
  membership?: FirebaseMembership | null;
  branchMembership?: FirebaseBranchMembership | null;
  /** Active churches in the user's organization (Firestore). */
  churchesCount?: number;
  /** Branches (user-facing churches) in the organization. */
  branchesCount?: number;
  workspaceType?: "independent_church" | "multi_church_org";
};

const ADMIN_MEMBERSHIP_ROLES: MembershipRole[] = [
  "owner",
  "org_admin",
  "church_admin",
];

function isAdminMembershipRole(role: MembershipRole): boolean {
  return (
    ADMIN_MEMBERSHIP_ROLES.includes(role) ||
    roleMeetsMinimum(role, "church_admin")
  );
}

export function resolvePrimaryBranchMembership(
  profile: FirestoreUser | null,
  branchMemberships: FirebaseBranchMembership[]
): FirebaseBranchMembership | null {
  if (!branchMemberships.length) return null;

  const activeBranchId = profile?.activeBranchId?.trim();
  if (activeBranchId) {
    const match = branchMemberships.find(
      (m) => m.branchId === activeBranchId && m.status === "active"
    );
    if (match) return match;
  }

  const churchId = profile?.churchId?.trim();
  if (churchId) {
    const match = branchMemberships.find(
      (m) => m.churchId === churchId && m.status === "active"
    );
    if (match) return match;
  }

  return (
    branchMemberships.find((m) => m.status === "active") ??
    branchMemberships[0] ??
    null
  );
}

function hasLegacyAdminProfile(profile: FirestoreUser): boolean {
  const role = String(profile.role ?? "");
  return (
    profile.churchRole === "admin" ||
    (profile.managedChurchIds?.length ?? 0) > 0 ||
    role === "admin" ||
    role === "owner" ||
    role === "org_admin" ||
    role === "church_admin"
  );
}

function hasWorkspaceContext(profile: FirestoreUser): boolean {
  return Boolean(
    profile.churchId?.trim() ||
      profile.activeBranchId?.trim() ||
      profile.organizationId?.trim()
  );
}

/** Multi-church org parent workspace: org exists, onboarding flag cleared, no church yet. */
function isOrgOnlyWorkspaceComplete(profile: FirestoreUser): boolean {
  return (
    profile.needsChurchOnboarding === false &&
    Boolean(profile.organizationId?.trim()) &&
    !profile.churchId?.trim() &&
    !profile.activeBranchId?.trim()
  );
}

/**
 * Firestore is the source of truth for onboarding completion.
 * Uses `users.needsChurchOnboarding` and org church count from API.
 */
export function isOnboardingComplete({
  profile,
  churchesCount = 0,
  workspaceType,
}: WorkspaceAccessInput): boolean {
  if (!profile) return false;
  if (profile.needsChurchOnboarding === true) return false;
  if (profile.organizationId?.trim()) return true;
  if (isOrgOnlyWorkspaceComplete(profile)) return true;
  if (workspaceType === "multi_church_org" && profile.organizationId) {
    return profile.needsChurchOnboarding === false;
  }
  if (profile.needsChurchOnboarding === false && profile.churchId) return true;
  if (
    profile.needsChurchOnboarding === false &&
    profile.activeBranchId?.trim()
  ) {
    return true;
  }
  if (churchesCount > 0 && profile.churchId) return true;
  return false;
}

export function needsChurchOnboarding(input: WorkspaceAccessInput): boolean {
  const { profile, churchesCount = 0, workspaceType } = input;
  if (!profile) return false;

  if (isMembershipPending(profile)) return false;

  if (isOnboardingComplete(input)) return false;

  if (profile.needsChurchOnboarding === true) return true;

  const hasWorkspacePointers = Boolean(
    profile.churchId?.trim() || profile.activeBranchId?.trim()
  );

  if (!hasWorkspacePointers) {
    if (!profile.organizationId?.trim()) return true;
    if (profile.needsChurchOnboarding === false) return false;
    if (profile.needsChurchOnboarding !== true) return false;
    if (
      workspaceType === "multi_church_org" &&
      churchesCount === 0 &&
      profile.needsChurchOnboarding === true
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Workspace access is derived from active membership documents — not `users.churchRole`.
 * Profile fields `churchId` / `activeBranchId` are active workspace pointers only.
 */
export function isMembershipPending(profile: FirestoreUser | null): boolean {
  return Boolean(profile?.pendingBranchId?.trim());
}

export function canAccessWorkspace(input: WorkspaceAccessInput): boolean {
  const { profile, membership, branchMembership, workspaceType } = input;
  if (!profile) return false;
  if (isPlatformSuperAdmin(profile.email)) return true;
  if (isMembershipPending(profile)) return false;

  if (membership?.status === "suspended") return false;
  if (branchMembership?.status === "suspended") return false;

  if (
    (workspaceType === "multi_church_org" || isOrgOnlyWorkspaceComplete(profile)) &&
    profile.organizationId
  ) {
    if (membership?.status === "active") {
      return roleMeetsMinimum(membership.role, "volunteer");
    }
    if (
      branchMembership?.status === "active" &&
      roleMeetsMinimum(branchMembership.role, "volunteer")
    ) {
      return true;
    }
    if (isOnboardingComplete(input)) return true;
  }

  const hasWorkspacePointers = Boolean(
    profile.churchId?.trim() && profile.activeBranchId?.trim()
  );
  if (!hasWorkspacePointers) return false;

  if (membership?.status === "active") {
    return roleMeetsMinimum(membership.role, "volunteer");
  }

  if (
    branchMembership?.status === "active" &&
    roleMeetsMinimum(branchMembership.role, "volunteer")
  ) {
    return true;
  }

  if (isOnboardingComplete(input) && hasWorkspacePointers) {
    return true;
  }

  return false;
}

export function resolveAccountType(input: WorkspaceAccessInput) {
  return resolveAccountTypeInternal(input);
}

export function isChurchOwner(input: WorkspaceAccessInput): boolean {
  return resolveAccountType(input) === "church_owner";
}

/** Church Management nav — owner, org_admin, and church_admin (and platform super-admin). */
export function canAccessChurchManagement(input: WorkspaceAccessInput): boolean {
  const { profile, membership, branchMembership } = input;
  if (!profile) return false;
  if (isPlatformSuperAdmin(profile.email)) return true;

  const hasAdminOrgMembership =
    membership?.status === "active" &&
    isAdminMembershipRole(membership.role);

  const hasAdminBranchMembership =
    branchMembership?.status === "active" &&
    isAdminMembershipRole(branchMembership.role);

  const isAdmin =
    hasAdminOrgMembership ||
    hasAdminBranchMembership ||
    hasLegacyAdminProfile(profile);

  if (!isAdmin) return false;

  if (canAccessWorkspace(input)) return true;
  if (isOnboardingComplete(input)) return true;
  if (hasWorkspaceContext(profile)) return true;

  return false;
}

/** Cookie hints only — never authoritative. */
export function getSessionCookieHints(input: WorkspaceAccessInput) {
  return {
    workspaceAccess: canAccessWorkspace(input),
    onboardingComplete: isOnboardingComplete(input),
  };
}

/** User belongs to an active workspace (not pending join). */
export function hasActiveWorkspace(input: WorkspaceAccessInput): boolean {
  const { profile } = input;
  if (!profile) return false;
  if (isMembershipPending(profile)) return false;
  if (canAccessWorkspace(input)) return true;
  return isOnboardingComplete(input);
}
