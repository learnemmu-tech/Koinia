import "server-only";

import { organizationAllowsWorkspaceAccess } from "@/lib/auth/organization-workspace-access-server";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";
import {
  getAppUserByClerkId,
  mapAppUserToProfile,
} from "@/lib/postgres/app-user";
import {
  getBranchMembershipsForClerkUser,
  getMembershipForClerkUser,
} from "@/lib/postgres/session";
import {
  canAccessChurchManagement,
  resolvePrimaryBranchMembership,
} from "@/lib/auth/workspace-access";

export async function verifyChurchContentPublisher(
  uid: string,
  _email: string | undefined
): Promise<boolean> {
  const appUser = await getAppUserByClerkId(uid);
  if (!appUser) return false;
  if (isPlatformSuperAdmin(appUser.platformRole)) return true;

  const orgAllowed = await organizationAllowsWorkspaceAccess(
    appUser.organizationId,
    appUser.platformRole
  );
  if (!orgAllowed) return false;

  const profile = mapAppUserToProfile(appUser);
  const membership = profile.organizationId
    ? await getMembershipForClerkUser(profile.organizationId, uid)
    : null;
  const branchMemberships = await getBranchMembershipsForClerkUser(uid);
  const branchMembership = resolvePrimaryBranchMembership(
    profile,
    branchMemberships
  );

  return canAccessChurchManagement({
    profile,
    membership,
    branchMembership,
    churchesCount: profile.churchId ? 1 : 0,
  });
}
