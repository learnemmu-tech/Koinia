import type { FirestoreUser } from "@/lib/firebase-auth-service";
import { isWorkspaceRoute, WORKSPACE_BASE } from "@/lib/dashboard-routes";
import type { FirebaseBranchMembership } from "@/types/branch-membership";
import type { MembershipStatus } from "@/types/membership";
import { roleMeetsMinimum } from "@/types/membership";

import { isOrganizationAccessSuspended } from "@/lib/auth/organization-workspace-access";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";
import { resolveSuperAdminPostAuthDestination } from "@/lib/auth/super-admin-routing";
import { sanitizeCallbackUrl } from "@/lib/callback-url";
import { churchWebsitePath } from "@/lib/templates/paths";
import { resolvePublicTemplateId } from "@/lib/templates/resolver";

import {
  ACCESS_DENIED_PATH,
  ACCOUNT_SUSPENDED_PATH,
  CREATE_WORKSPACE_PATH,
  ONBOARDING_WEBSITE_PATH,
  isChurchWebsiteAuthPath,
  isCreateWorkspacePath as isCreateWorkspacePathInternal,
  isInvitePath,
  isJoinPath,
  joinPathForSlug,
  MEMBERSHIP_REMOVED_PATH,
  ORGANIZATION_SUSPENDED_PATH,
  parseChurchWebsiteSlugFromPath,
  parseJoinSlugFromPath,
  isPostAuthContinuePath,
  WAITING_APPROVAL_PATH,
} from "./auth-paths";
import {
  canAccessChurchManagement,
  hasActiveWorkspace,
  isMembershipPending,
  type WorkspaceAccessInput,
} from "./workspace-access";

export {
  ACCESS_DENIED_PATH,
  ACCOUNT_SUSPENDED_PATH,
  MEMBERSHIP_REMOVED_PATH,
  ORGANIZATION_SUSPENDED_PATH,
} from "./auth-paths";

export type MembershipRoutingStatus =
  | "active"
  | "pending"
  | "rejected"
  | "removed"
  | "suspended"
  | "org_suspended"
  | "none";

export type MembershipRoutingResult = {
  status: MembershipRoutingStatus;
  destination: string;
};

/** Fallback app home for Signature members and unknown church context. */
export const MEMBER_HOME_PATH = "/";

/**
 * Authenticated member landing path for the church they belong to.
 * Heritage members stay on the church site (`/c/{slug}`). Signature members
 * keep the existing FaithConnectHub app home. Admins are handled separately.
 */
export function memberExperiencePath(input: {
  slug?: string | null;
  activeTemplate?: string | null;
}): string {
  const slug = input.slug?.trim();
  if (!slug) return MEMBER_HOME_PATH;
  if (resolvePublicTemplateId(input.activeTemplate) === "heritage") {
    return churchWebsitePath(slug);
  }
  return MEMBER_HOME_PATH;
}

export function routeForBranchMembershipStatus(
  status: MembershipStatus
): string | null {
  switch (status) {
    case "pending":
      return WAITING_APPROVAL_PATH;
    case "rejected":
      return ACCESS_DENIED_PATH;
    case "removed":
      return MEMBERSHIP_REMOVED_PATH;
    case "suspended":
      return ACCOUNT_SUSPENDED_PATH;
    default:
      return null;
  }
}

/**
 * Pick the branch membership that should drive post-auth routing.
 * Supports multiple branch memberships per user (future multi-workspace).
 */
export function resolvePrimaryBranchMembership(
  profile: FirestoreUser | null,
  branchMemberships: FirebaseBranchMembership[]
): FirebaseBranchMembership | null {
  if (!branchMemberships.length) return null;

  const pendingId = profile?.pendingBranchId?.trim();
  if (pendingId) {
    const pending = branchMemberships.find((m) => m.branchId === pendingId);
    if (pending) return pending;
  }

  const activeId = profile?.activeBranchId?.trim();
  if (activeId) {
    const active = branchMemberships.find((m) => m.branchId === activeId);
    if (active) return active;
  }

  const churchId = profile?.churchId?.trim();
  if (churchId) {
    const match = branchMemberships.find(
      (m) => m.churchId === churchId || m.branchId === churchId
    );
    if (match) return match;
  }

  const active = branchMemberships.filter((m) => m.status === "active");
  if (active.length === 1) return active[0]!;

  return null;
}

/**
 * Church/org admins → dashboard; regular members → home.
 * Role is derived only from PostgreSQL-backed membership objects (never client role).
 */
function resolveActiveWorkspaceDestination(
  accessInput: WorkspaceAccessInput,
  branchMemberships: FirebaseBranchMembership[],
  churchSite?: { slug?: string | null; activeTemplate?: string | null }
): string {
  if (canAccessChurchManagement(accessInput)) {
    return WORKSPACE_BASE;
  }

  const hasAdminBranch = branchMemberships.some(
    (m) =>
      m.status === "active" && roleMeetsMinimum(m.role, "church_admin")
  );
  if (hasAdminBranch) {
    return WORKSPACE_BASE;
  }

  return memberExperiencePath(churchSite ?? {});
}

export type ResolveMembershipRoutingInput = WorkspaceAccessInput & {
  callbackUrl?: string | null;
  branchMemberships?: FirebaseBranchMembership[];
  websiteSetupCompleted?: boolean;
  churchSlug?: string | null;
  activeTemplate?: string | null;
};

/**
 * Membership status controls routing — Firebase auth alone never decides destination.
 */
export function resolveMembershipRouting({
  profile,
  membership,
  churchesCount = 0,
  branchesCount,
  workspaceType,
  organizationStatus,
  callbackUrl,
  branchMemberships = [],
  websiteSetupCompleted,
  churchSlug,
  activeTemplate,
}: ResolveMembershipRoutingInput): MembershipRoutingResult {
  let sanitized = callbackUrl ? sanitizeCallbackUrl(callbackUrl, "") : "";
  if (
    sanitized === "/signin" ||
    sanitized.startsWith("/signin/") ||
    sanitized === "/signup" ||
    sanitized.startsWith("/signup/") ||
    sanitized === "/sso-callback" ||
    sanitized.startsWith("/sso-callback/") ||
    sanitized === "/forgot-password" ||
    sanitized.startsWith("/forgot-password/") ||
    isChurchWebsiteAuthPath(sanitized) ||
    isPostAuthContinuePath(sanitized)
  ) {
    sanitized = "";
  }

  if (isInvitePath(sanitized)) {
    return { status: "none", destination: sanitized };
  }

  const joinSlug = parseJoinSlugFromPath(sanitized);
  if (joinSlug) {
    return { status: "none", destination: joinPathForSlug(joinSlug) };
  }

  if (isPlatformSuperAdmin(profile?.platformRole)) {
    return {
      status: "active",
      destination: resolveSuperAdminPostAuthDestination(sanitized),
    };
  }

  if (isOrganizationAccessSuspended(organizationStatus)) {
    return {
      status: "org_suspended",
      destination: ORGANIZATION_SUSPENDED_PATH,
    };
  }

  if (membership?.status === "suspended") {
    return {
      status: "suspended",
      destination: ACCOUNT_SUSPENDED_PATH,
    };
  }

  if (isMembershipPending(profile)) {
    return { status: "pending", destination: WAITING_APPROVAL_PATH };
  }

  const primaryBranch = resolvePrimaryBranchMembership(
    profile,
    branchMemberships
  );

  if (primaryBranch) {
    const branchRoute = routeForBranchMembershipStatus(primaryBranch.status);
    if (branchRoute) {
      return {
        status: primaryBranch.status as MembershipRoutingStatus,
        destination: branchRoute,
      };
    }
  }

  const accessInput: WorkspaceAccessInput = {
    profile,
    membership,
    branchMembership: primaryBranch,
    churchesCount,
    branchesCount,
    workspaceType,
    organizationStatus,
  };

  const pgOnboardingDone = profile?.needsChurchOnboarding === false;
  const callbackChurchSlug = parseChurchWebsiteSlugFromPath(sanitized);

  if (!pgOnboardingDone) {
    if (callbackChurchSlug && !isChurchWebsiteAuthPath(sanitized)) {
      return { status: "none", destination: joinPathForSlug(callbackChurchSlug) };
    }
    return { status: "none", destination: CREATE_WORKSPACE_PATH };
  }

  const setupComplete =
    websiteSetupCompleted ?? profile?.websiteSetupCompleted !== false;
  if (!setupComplete) {
    return { status: "none", destination: ONBOARDING_WEBSITE_PATH };
  }

  const roleAwareDefault = resolveActiveWorkspaceDestination(
    accessInput,
    branchMemberships,
    { slug: churchSlug, activeTemplate }
  );

  // The dashboard is for administrators only. A stored/forged `/dashboard`
  // callback must never carry an ordinary member there.
  if (
    sanitized &&
    roleAwareDefault !== WORKSPACE_BASE &&
    isWorkspaceRoute(sanitized.split(/[?#]/)[0] ?? sanitized)
  ) {
    sanitized = "";
  }

  // A feature callback for a church the user does not belong to goes through
  // that church's existing join flow — sign-in must never bypass approval.
  if (
    callbackChurchSlug &&
    callbackChurchSlug.toLowerCase() !== (churchSlug?.trim().toLowerCase() ?? "")
  ) {
    return {
      status: "active",
      destination: joinPathForSlug(callbackChurchSlug),
    };
  }

  // Completed users who landed with an onboarding callback (e.g. Sign Up Google)
  // must not be forced into workspace creation — use role-aware home/dashboard.
  if (isCreateWorkspacePathInternal(sanitized, sanitizeCallbackUrl)) {
    return { status: "active", destination: roleAwareDefault };
  }

  if (
    primaryBranch?.status === "active" ||
    (membership?.status === "active" &&
      roleMeetsMinimum(membership.role, "volunteer") &&
      hasActiveWorkspace(accessInput))
  ) {
    // "/" is the sanitize fallback / member home — never treat it as an
    // explicit post-auth callback that overrides role-aware defaults.
    // Otherwise admins get destination "/" and RequireWorkspaceAccess
    // immediately bounces every /dashboard/* soft navigation back home.
    if (
      sanitized &&
      sanitized !== "/" &&
      sanitized !== CREATE_WORKSPACE_PATH &&
      !isJoinPath(sanitized)
    ) {
      return { status: "active", destination: sanitized };
    }
    return { status: "active", destination: roleAwareDefault };
  }

  if (
    sanitized &&
    sanitized !== CREATE_WORKSPACE_PATH &&
    sanitized !== "/"
  ) {
    return { status: "active", destination: sanitized };
  }

  return { status: "active", destination: roleAwareDefault };
}

export function resolveMembershipRoutingDestination(
  input: ResolveMembershipRoutingInput
): string {
  return resolveMembershipRouting(input).destination;
}
