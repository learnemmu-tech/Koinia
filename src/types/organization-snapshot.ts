import type { FirebaseBranch } from "@/types/branch";
import type { FirebaseBranchMembership } from "@/types/branch-membership";
import type { FirebaseChurch } from "@/types/firebase-church";
import type { FirebaseMembership } from "@/types/membership";
import type { FirebaseOrganization } from "@/types/organization";

/** Client-safe workspace snapshot shape (no server-only imports). */
export type OrganizationSnapshot = {
  organization: FirebaseOrganization;
  membership: FirebaseMembership | null;
  branchMembership: FirebaseBranchMembership | null;
  branchMemberships: FirebaseBranchMembership[];
  churches: FirebaseChurch[];
  branchesByChurch: Record<string, FirebaseBranch[]>;
  userProfile?: {
    activeBranchId?: string;
    churchId?: string;
  };
};
