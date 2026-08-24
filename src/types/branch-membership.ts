import type { MembershipRole, MembershipStatus } from "@/types/membership";

/** Branch-scoped membership — separate from organization membership. */
export type FirebaseBranchMembership = {
  id: string;
  organizationId: string;
  churchId: string;
  branchId: string;
  userId: string;
  role: MembershipRole;
  status: MembershipStatus;
  createdAt: number;
  updatedAt: number;
};

export type CreateBranchMembershipInput = {
  organizationId: string;
  churchId: string;
  branchId: string;
  userId: string;
  role: MembershipRole;
  status?: MembershipStatus;
};

export type UpdateBranchMembershipInput = Partial<
  Pick<FirebaseBranchMembership, "role" | "status">
>;
