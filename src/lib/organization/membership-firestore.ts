import type {
  CreateMembershipInput,
  FirebaseMembership,
  MembershipRole,
  MembershipStatus,
} from "@/types/membership";

import { toMillis } from "@/lib/firebase-utils";

import { buildMembershipId } from "./organization-firestore";

export const MEMBERSHIPS_COLLECTION = "memberships";

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

const VALID_STATUSES: MembershipStatus[] = ["active", "invited", "suspended"];

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

export function normalizeMembershipFromFirestore(
  id: string,
  data: Record<string, unknown>
): FirebaseMembership {
  return {
    id,
    organizationId: String(data.organizationId ?? "").trim(),
    userId: String(data.userId ?? "").trim(),
    role: normalizeRole(data.role),
    status: normalizeStatus(data.status),
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt ?? data.createdAt),
  };
}

export function buildMembershipCreatePayload(input: CreateMembershipInput) {
  return {
    organizationId: input.organizationId.trim(),
    userId: input.userId.trim(),
    role: input.role,
    status: input.status ?? "active",
  };
}

export function resolveMembershipDocumentId(
  organizationId: string,
  userId: string
): string {
  return buildMembershipId(organizationId, userId);
}
