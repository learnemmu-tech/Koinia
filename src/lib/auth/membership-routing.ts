import type { FirestoreUser } from "@/lib/firebase-auth-service";
import { WORKSPACE_BASE } from "@/lib/dashboard-routes";
import type { FirebaseBranchMembership } from "@/types/branch-membership";
import type { FirebaseMembership, MembershipStatus } from "@/types/membership";
import { roleMeetsMinimum } from "@/types/membership";

import { sanitizeCallbackUrl } from "@/lib/callback-url";

import {
  ACCESS_DENIED_PATH,
  ACCOUNT_SUSPENDED_PATH,
  CREATE_WORKSPACE_PATH,
  isCreateWorkspacePath as isCreateWorkspacePathInternal,
  isInvitePath,
  isJoinPath,
  joinPathForSlug,
  MEMBERSHIP_REMOVED_PATH,
  parseJoinSlugFromPath,
  WAITING_APPROVAL_PATH,
} from "./auth-paths";
import {
  hasActiveWorkspace,
  isMembershipPending,
  needsChurchOnboarding,
  type WorkspaceAccessInput,
} from "./workspace-access";

export {
  ACCESS_DENIED_PATH,
  ACCOUNT_SUSPENDED_PATH,
  MEMBERSHIP_REMOVED_PATH,
} from "./auth-paths";

export type MembershipRoutingStatus =
  | "active"
  | "pending"
  | "rejected"
  | "removed"
  | "suspended"
  | "none";

export type MembershipRoutingResult = {
  status: MembershipRoutingStatus;
  destination: string;
};

const TERMINAL_BRANCH_STATUSES = new Set<MembershipStatus>([
  "rejected",
  "removed",
  "suspended",
]);

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

  const nonTerminal = branchMemberships.find(
    (m) => !TERMINAL_BRANCH_STATUSES.has(m.status)
  );
  return nonTerminal ?? branchMemberships[0] ?? null;
}

export type ResolveMembershipRoutingInput = WorkspaceAccessInput & {
  callbackUrl?: string | null;
  branchMemberships?: FirebaseBranchMembership[];
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
  callbackUrl,
  branchMemberships = [],
}: ResolveMembershipRoutingInput): MembershipRoutingResult {
  const sanitized = callbackUrl ? sanitizeCallbackUrl(callbackUrl, "") : "";

  if (isInvitePath(sanitized)) {
    return { status: "none", destination: sanitized };
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
    churchesCount,
    branchesCount,
    workspaceType,
  };

  const joinSlug = parseJoinSlugFromPath(sanitized);
  if (joinSlug) {
    return { status: "none", destination: joinPathForSlug(joinSlug) };
  }

  if (isCreateWorkspacePathInternal(sanitized, sanitizeCallbackUrl)) {
    if (hasActiveWorkspace(accessInput)) {
      return { status: "active", destination: WORKSPACE_BASE };
    }
    return { status: "none", destination: CREATE_WORKSPACE_PATH };
  }

  if (
    primaryBranch?.status === "active" ||
    (membership?.status === "active" &&
      roleMeetsMinimum(membership.role, "volunteer") &&
      hasActiveWorkspace(accessInput))
  ) {
    if (
      sanitized &&
      sanitized !== CREATE_WORKSPACE_PATH &&
      !isJoinPath(sanitized)
    ) {
      return { status: "active", destination: sanitized };
    }
    return { status: "active", destination: WORKSPACE_BASE };
  }

  if (needsChurchOnboarding(accessInput)) {
    return { status: "none", destination: CREATE_WORKSPACE_PATH };
  }

  if (
    sanitized &&
    sanitized !== CREATE_WORKSPACE_PATH &&
    sanitized !== "/"
  ) {
    return { status: "none", destination: sanitized };
  }

  if (hasActiveWorkspace(accessInput)) {
    return { status: "active", destination: WORKSPACE_BASE };
  }

  return { status: "none", destination: CREATE_WORKSPACE_PATH };
}

export function resolveMembershipRoutingDestination(
  input: ResolveMembershipRoutingInput
): string {
  return resolveMembershipRouting(input).destination;
}
