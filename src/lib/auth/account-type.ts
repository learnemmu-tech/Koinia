import type { FirestoreUser } from "@/lib/firebase-auth-service";
import type { FirebaseBranchMembership } from "@/types/branch-membership";
import type { FirebaseMembership } from "@/types/membership";
import { roleMeetsMinimum } from "@/types/membership";

import type { WorkspaceAccessInput } from "./workspace-access";

/**
 * Account types for post-auth routing. Designed for future expansion:
 * - church_owner: org owner / admin roles via membership
 * - church_member: active team member
 * - consumer: browses public content only
 */
export type AccountType = "church_owner" | "church_member" | "consumer";

export function resolveAccountType({
  profile,
  membership,
  branchMembership,
}: WorkspaceAccessInput): AccountType {
  if (!profile) return "consumer";

  if (membership?.status === "active") {
    if (
      membership.role === "owner" ||
      membership.role === "org_admin" ||
      membership.role === "church_admin"
    ) {
      return "church_owner";
    }
    if (roleMeetsMinimum(membership.role, "volunteer")) {
      return "church_member";
    }
  }

  if (
    branchMembership?.status === "active" &&
    (branchMembership.role === "owner" ||
      branchMembership.role === "org_admin" ||
      branchMembership.role === "church_admin" ||
      roleMeetsMinimum(branchMembership.role, "church_admin"))
  ) {
    return "church_owner";
  }

  if (profile.churchRole === "admin" || (profile.managedChurchIds?.length ?? 0) > 0) {
    return "church_owner";
  }

  if (profile.churchId || profile.activeBranchId) {
    return "church_member";
  }

  return "consumer";
}
