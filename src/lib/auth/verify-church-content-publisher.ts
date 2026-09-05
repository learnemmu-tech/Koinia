import "server-only";

import { isPlatformSuperAdmin } from "@/lib/church-access";
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
  email: string | undefined
): Promise<boolean> {
  if (isPlatformSuperAdmin(email)) return true;

  const appUser = await getAppUserByClerkId(uid);
  if (!appUser) return false;

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
