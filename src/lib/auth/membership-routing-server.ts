import "server-only";

import type { FirestoreUser } from "@/lib/firebase-auth-service";
import {
  resolveMembershipRouting,
  type MembershipRoutingResult,
} from "@/lib/auth/membership-routing";
import { getWorkspaceType } from "@/lib/organization/workspace-type";
import type { FirebaseBranchMembership } from "@/types/branch-membership";
import {
  getAppUserByClerkId,
  mapAppUserToProfile,
} from "@/lib/postgres/app-user";
import { listAllBranchMembershipsForUser } from "@/lib/postgres/memberships";
import {
  countOrganizationChurches,
  getMembershipForUser,
  getOrganizationById,
} from "@/lib/postgres/tenants";

export async function listAllBranchMembershipsForUserExport(
  userId: string
): Promise<FirebaseBranchMembership[]> {
  return listAllBranchMembershipsForUser(userId);
}

export { listAllBranchMembershipsForUser };

async function loadUserProfile(userId: string): Promise<FirestoreUser | null> {
  const appUser = await getAppUserByClerkId(userId);
  if (!appUser) return null;
  return mapAppUserToProfile(appUser);
}

export async function resolveUserMembershipRouting(
  userId: string,
  callbackUrl?: string | null
): Promise<MembershipRoutingResult> {
  const profile = await loadUserProfile(userId);
  const organizationId = profile?.organizationId?.trim() ?? "";

  const [membership, branchMemberships, churchesCount, organization] =
    await Promise.all([
      organizationId
        ? getMembershipForUser(organizationId, userId)
        : Promise.resolve(null),
      listAllBranchMembershipsForUser(userId),
      organizationId
        ? countOrganizationChurches(organizationId)
        : Promise.resolve(0),
      organizationId ? getOrganizationById(organizationId) : Promise.resolve(null),
    ]);

  const workspaceType = getWorkspaceType(organization);

  return resolveMembershipRouting({
    profile,
    membership,
    branchMemberships,
    churchesCount,
    branchesCount: churchesCount,
    workspaceType,
    callbackUrl,
  });
}
