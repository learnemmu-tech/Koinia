import "server-only";

import {
  canAccessChurchManagement,
  canManageOrganizationWorkspace,
  resolvePrimaryBranchMembership,
} from "@/lib/auth/workspace-access";
import { organizationAllowsWorkspaceAccess } from "@/lib/auth/organization-workspace-access-server";
import {
  getAppUserByClerkId,
  mapAppUserToProfile,
} from "@/lib/postgres/app-user";
import {
  getBranchMembershipsForClerkUser,
  getMembershipForClerkUser,
} from "@/lib/postgres/session";
import type { ShepherdAudienceMode } from "@/lib/shepherd/validation";

export type ShepherdUserContext = {
  clerkId: string;
  email: string | undefined;
  displayName: string;
  mode: ShepherdAudienceMode;
  isOrganizationAdmin: boolean;
  isChurchAdmin: boolean;
  churchId: string | null;
  organizationId: string | null;
};

export async function resolveShepherdUserContext(
  clerkId: string,
  email: string | undefined
): Promise<ShepherdUserContext | null> {
  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser) return null;

  const orgAllowed = await organizationAllowsWorkspaceAccess(
    appUser.organizationId,
    appUser.platformRole
  );
  if (!orgAllowed && appUser.organizationId) {
    // Suspended org users may still ask faith questions as members of the product,
    // but treat them as member mode without admin capabilities.
  }

  const profile = mapAppUserToProfile(appUser);
  const membership = profile.organizationId
    ? await getMembershipForClerkUser(profile.organizationId, clerkId)
    : null;
  const branchMemberships = await getBranchMembershipsForClerkUser(clerkId);
  const branchMembership = resolvePrimaryBranchMembership(
    profile,
    branchMemberships
  );

  const accessInput = {
    profile,
    membership,
    branchMembership,
    churchesCount: profile.churchId ? 1 : 0,
    organizationStatus: null as string | null,
  };

  const isOrganizationAdmin = canManageOrganizationWorkspace(accessInput);
  const isChurchAdmin = canAccessChurchManagement(accessInput);
  const mode: ShepherdAudienceMode =
    isOrganizationAdmin || isChurchAdmin ? "ministry" : "member";

  const displayName =
    `${appUser.firstName ?? ""} ${appUser.lastName ?? ""}`.trim() ||
    email?.split("@")[0] ||
    "Friend";

  return {
    clerkId,
    email,
    displayName,
    mode,
    isOrganizationAdmin,
    isChurchAdmin,
    churchId: profile.churchId ?? null,
    organizationId: profile.organizationId ?? null,
  };
}
