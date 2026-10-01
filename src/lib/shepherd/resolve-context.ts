import "server-only";

import {
  canAccessChurchManagement,
  canManageOrganizationWorkspace,
  resolvePrimaryBranchMembership,
} from "@/lib/auth/workspace-access";
import { organizationAllowsWorkspaceAccess } from "@/lib/auth/organization-workspace-access-server";
import { getActiveChurchIdFromCookies } from "@/lib/church-server";
import { getChurchById } from "@/lib/church-queries";
import {
  getAppUserByClerkId,
  mapAppUserToProfile,
} from "@/lib/postgres/app-user";
import {
  getBranchMembershipsForClerkUser,
  getChurchMembershipRow,
  getMembershipForClerkUser,
  getOrgMembershipRow,
  userCanManageChurch,
} from "@/lib/postgres/session";
import { isPostgresUuid } from "@/lib/postgres/uuid";
import type { ShepherdAudienceMode } from "@/lib/shepherd/validation";
import { roleMeetsMinimum, type MembershipRole } from "@/types/membership";

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

function displayNameFor(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  email: string | undefined
): string {
  return (
    `${firstName ?? ""} ${lastName ?? ""}`.trim() ||
    email?.split("@")[0] ||
    "Friend"
  );
}

export async function resolveShepherdUserContext(
  clerkId: string,
  email: string | undefined,
  preferredChurchId?: string | null
): Promise<ShepherdUserContext | null> {
  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser) return null;

  const cookieChurchId = await getActiveChurchIdFromCookies();
  const requested =
    (preferredChurchId && isPostgresUuid(preferredChurchId)
      ? preferredChurchId
      : "") ||
    (cookieChurchId && isPostgresUuid(cookieChurchId) ? cookieChurchId : "");

  const displayName = displayNameFor(
    appUser.firstName,
    appUser.lastName,
    email
  );

  if (requested) {
    const church = await getChurchById(requested);
    if (!church?.isActive) return null;
    const organizationId = church.organizationId?.trim();
    if (!organizationId) return null;

    const [membership, orgRow, isChurchAdmin] = await Promise.all([
      getChurchMembershipRow(appUser.id, church.id),
      getOrgMembershipRow(appUser.id, organizationId),
      userCanManageChurch(clerkId, email, church.id),
    ]);
    const isOrgAdmin =
      orgRow?.status === "active" &&
      roleMeetsMinimum(orgRow.role as MembershipRole, "org_admin");
    const isMember = membership?.status === "active";
    if (!isMember && !isOrgAdmin) return null;

    return {
      clerkId,
      email,
      displayName,
      mode: isOrgAdmin || isChurchAdmin ? "ministry" : "member",
      isOrganizationAdmin: isOrgAdmin,
      isChurchAdmin,
      churchId: church.id,
      organizationId,
    };
  }

  const orgAllowed = await organizationAllowsWorkspaceAccess(
    appUser.organizationId,
    appUser.platformRole
  );
  if (!orgAllowed && appUser.organizationId) {
    // Suspended org users may still ask faith questions as members.
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
