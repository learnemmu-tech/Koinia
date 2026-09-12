import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { churchMemberships } from "@/db/schema";
import {
  resolveMembershipRouting,
  type MembershipRoutingResult,
} from "@/lib/auth/membership-routing";
import { getWorkspaceType } from "@/lib/organization/workspace-type";
import {
  getAppUserByClerkId,
  mapAppUserToProfile,
} from "@/lib/postgres/app-user";
import {
  mapChurchMembership,
  mapOrgMembership,
  type OrgMembershipRow,
} from "@/lib/postgres/mappers";
import { listAllBranchMembershipsForUser } from "@/lib/postgres/memberships";
import { getOrgMembershipRow } from "@/lib/postgres/session";
import {
  countOrganizationChurches,
  getOrganizationById,
} from "@/lib/postgres/tenants";
import type { FirebaseBranchMembership } from "@/types/branch-membership";
import {
  roleMeetsMinimum,
  type FirebaseMembership,
  type MembershipRole,
} from "@/types/membership";

export async function listAllBranchMembershipsForUserExport(
  userId: string
): Promise<FirebaseBranchMembership[]> {
  return listAllBranchMembershipsForUser(userId);
}

export { listAllBranchMembershipsForUser };

function membershipFromRows(
  organizationId: string,
  clerkId: string,
  orgRow: OrgMembershipRow | null,
  churchRows: Array<typeof churchMemberships.$inferSelect>
): FirebaseMembership | null {
  if (orgRow) {
    return mapOrgMembership(orgRow, clerkId);
  }

  const adminChurch = churchRows.find(
    (row) =>
      row.status === "active" &&
      roleMeetsMinimum(row.role as MembershipRole, "church_admin")
  );
  if (adminChurch) {
    return {
      id: adminChurch.id,
      organizationId,
      userId: clerkId,
      role: "church_admin",
      status: "active",
      createdAt: adminChurch.createdAt.getTime(),
      updatedAt: adminChurch.updatedAt.getTime(),
    };
  }

  const activeChurch = churchRows.find((row) => row.status === "active");
  if (activeChurch) {
    return {
      id: activeChurch.id,
      organizationId,
      userId: clerkId,
      role: (activeChurch.role as MembershipRole) ?? "member",
      status: "active",
      createdAt: activeChurch.createdAt.getTime(),
      updatedAt: activeChurch.updatedAt.getTime(),
    };
  }

  return null;
}

/**
 * One user lookup, then one parallel fan-out. Church memberships are reused for
 * both effective org membership and branch membership lists (avoids the old
 * triple getAppUser + duplicate church_memberships scans).
 */
export async function resolveUserMembershipRouting(
  userId: string,
  callbackUrl?: string | null
): Promise<MembershipRoutingResult> {
  const appUser = await getAppUserByClerkId(userId);
  const profile = appUser ? mapAppUserToProfile(appUser) : null;
  const organizationId = profile?.organizationId?.trim() ?? "";

  if (!appUser) {
    return resolveMembershipRouting({
      profile: null,
      membership: null,
      branchMemberships: [],
      churchesCount: 0,
      branchesCount: 0,
      workspaceType: undefined,
      organizationStatus: null,
      callbackUrl,
    });
  }

  const [orgRow, churchRows, churchesCount, organization] = await Promise.all([
    organizationId
      ? getOrgMembershipRow(appUser.id, organizationId)
      : Promise.resolve(null),
    db
      .select()
      .from(churchMemberships)
      .where(eq(churchMemberships.userId, appUser.id)),
    organizationId
      ? countOrganizationChurches(organizationId)
      : Promise.resolve(0),
    organizationId ? getOrganizationById(organizationId) : Promise.resolve(null),
  ]);

  const orgChurchRows = organizationId
    ? churchRows.filter((row) => row.organizationId === organizationId)
    : churchRows;

  const membership = organizationId
    ? membershipFromRows(organizationId, userId, orgRow, orgChurchRows)
    : null;
  const branchMemberships = churchRows.map((row) =>
    mapChurchMembership(row, userId)
  );
  const workspaceType = getWorkspaceType(organization);

  return resolveMembershipRouting({
    profile,
    membership,
    branchMemberships,
    churchesCount,
    branchesCount: churchesCount,
    workspaceType,
    organizationStatus: organization?.status ?? null,
    callbackUrl,
  });
}
