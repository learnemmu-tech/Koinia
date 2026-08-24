import type {
  CreateBranchMembershipInput,
  FirebaseBranchMembership,
} from "@/types/branch-membership";
import type { MembershipRole, MembershipStatus } from "@/types/membership";

import { toMillis } from "@/lib/firebase-utils";

export const BRANCH_MEMBERSHIPS_COLLECTION = "branchMemberships";

const VALID_ROLES: MembershipRole[] = [
  "owner",
  "org_admin",
  "church_admin",
  "branch_admin",
  "leader",
  "editor",
  "member",
  "volunteer",
];

const VALID_STATUSES: MembershipStatus[] = [
  "active",
  "invited",
  "pending",
  "suspended",
  "rejected",
  "removed",
];

function normalizeRole(value: unknown): MembershipRole {
  const role = String(value ?? "member").trim().toLowerCase();
  if (VALID_ROLES.includes(role as MembershipRole)) {
    return role as MembershipRole;
  }
  return "member";
}

function normalizeStatus(value: unknown): MembershipStatus {
  const status = String(value ?? "active").trim().toLowerCase();
  if (VALID_STATUSES.includes(status as MembershipStatus)) {
    return status as MembershipStatus;
  }
  return "active";
}

export function resolveBranchMembershipDocumentId(
  branchId: string,
  userId: string
): string {
  return `${branchId.trim()}_${userId.trim()}`;
}

export function normalizeBranchMembershipFromFirestore(
  id: string,
  data: Record<string, unknown>
): FirebaseBranchMembership {
  return {
    id,
    organizationId: String(data.organizationId ?? "").trim(),
    churchId: String(data.churchId ?? "").trim(),
    branchId: String(data.branchId ?? "").trim(),
    userId: String(data.userId ?? "").trim(),
    role: normalizeRole(data.role),
    status: normalizeStatus(data.status),
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt ?? data.createdAt),
  };
}

export function buildBranchMembershipCreatePayload(
  input: CreateBranchMembershipInput
) {
  return {
    organizationId: input.organizationId.trim(),
    churchId: input.churchId.trim(),
    branchId: input.branchId.trim(),
    userId: input.userId.trim(),
    role: input.role,
    status: input.status ?? "active",
  };
}
