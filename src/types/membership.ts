/** Organization-scoped roles — ordered by privilege (highest first). */
export type MembershipRole =
  | "owner"
  | "org_admin"
  | "church_admin"
  | "branch_admin"
  | "leader"
  | "editor"
  | "member"
  | "volunteer";

export type MembershipStatus =
  | "active"
  | "invited"
  | "pending"
  | "suspended"
  | "rejected"
  | "removed";

export type FirebaseMembership = {
  id: string;
  organizationId: string;
  userId: string;
  /** Organization-level membership — never set churchId/branchId on new records */
  role: MembershipRole;
  status: MembershipStatus;
  createdAt: number;
  updatedAt: number;
};

export type CreateMembershipInput = {
  organizationId: string;
  userId: string;
  role: MembershipRole;
  status?: MembershipStatus;
};

export type UpdateMembershipInput = Partial<
  Pick<FirebaseMembership, "role" | "status">
>;

/** Role hierarchy for permission checks */
export const MEMBERSHIP_ROLE_RANK: Record<MembershipRole, number> = {
  owner: 100,
  org_admin: 80,
  church_admin: 60,
  branch_admin: 50,
  leader: 45,
  editor: 40,
  member: 20,
  volunteer: 10,
};

export function roleMeetsMinimum(
  role: MembershipRole,
  minimum: MembershipRole
): boolean {
  return MEMBERSHIP_ROLE_RANK[role] >= MEMBERSHIP_ROLE_RANK[minimum];
}
