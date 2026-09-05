import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  churchMemberships,
  churches,
  organizationMemberships,
  users,
} from "@/db/schema";
import { isPlatformSuperAdmin } from "@/lib/church-access";
import {
  getAppUserByClerkId,
  mapAppUserToProfile,
  type AppUserRow,
} from "@/lib/postgres/app-user";
import {
  mapChurchMembership,
  mapOrgMembership,
} from "@/lib/postgres/mappers";
import { isPostgresUuid } from "@/lib/postgres/uuid";
import { roleMeetsMinimum, type MembershipRole } from "@/types/membership";
import type { FirebaseBranchMembership } from "@/types/branch-membership";
import type { FirebaseMembership } from "@/types/membership";

export async function requireAppUserByClerkId(
  clerkId: string
): Promise<AppUserRow> {
  const user = await getAppUserByClerkId(clerkId);
  if (!user) {
    throw new Error("Application user not found.");
  }
  return user;
}

export async function getClerkIdByUserId(
  userId: string
): Promise<string | null> {
  const [row] = await db
    .select({ clerkId: users.clerkId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.clerkId ?? null;
}

export async function getClerkIdsByUserIds(
  userIds: string[]
): Promise<Map<string, string>> {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (ids.length === 0) return new Map();

  const rows = await db
    .select({ id: users.id, clerkId: users.clerkId })
    .from(users)
    .where(inArray(users.id, ids));

  const map = new Map<string, string>();
  for (const row of rows) {
    if (row.clerkId) map.set(row.id, row.clerkId);
  }
  return map;
}

export async function getUsersByClerkIds(clerkIds: string[]) {
  const ids = [...new Set(clerkIds.filter(Boolean))];
  if (ids.length === 0) return [];
  return db.select().from(users).where(inArray(users.clerkId, ids));
}

export async function getUsersByIds(userIds: string[]) {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (ids.length === 0) return [];
  return db.select().from(users).where(inArray(users.id, ids));
}

export async function getOrgMembershipRow(userId: string, organizationId: string) {
  const [row] = await db
    .select()
    .from(organizationMemberships)
    .where(
      and(
        eq(organizationMemberships.userId, userId),
        eq(organizationMemberships.organizationId, organizationId)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function getChurchMembershipRow(userId: string, churchId: string) {
  const [row] = await db
    .select()
    .from(churchMemberships)
    .where(
      and(
        eq(churchMemberships.userId, userId),
        eq(churchMemberships.churchId, churchId)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function listChurchMembershipsForUser(userId: string) {
  return db
    .select()
    .from(churchMemberships)
    .where(eq(churchMemberships.userId, userId));
}

export async function getManagedChurchIds(
  userId: string,
  organizationId: string
): Promise<string[]> {
  const rows = await db
    .select({ churchId: churchMemberships.churchId, role: churchMemberships.role })
    .from(churchMemberships)
    .where(
      and(
        eq(churchMemberships.userId, userId),
        eq(churchMemberships.organizationId, organizationId),
        eq(churchMemberships.status, "active")
      )
    );

  return rows
    .filter((row) =>
      roleMeetsMinimum(row.role as MembershipRole, "church_admin")
    )
    .map((row) => row.churchId);
}

/**
 * Effective organization membership for UI/API checks.
 * Org owner/org_admin come from organization_memberships.
 * Church administrators without an org-admin row are synthesized as church_admin.
 */
export async function getMembershipForClerkUser(
  organizationId: string,
  clerkId: string
): Promise<FirebaseMembership | null> {
  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser) return null;

  const orgRow = await getOrgMembershipRow(appUser.id, organizationId);
  if (orgRow) {
    return mapOrgMembership(orgRow, clerkId);
  }

  const churchRows = await db
    .select()
    .from(churchMemberships)
    .where(
      and(
        eq(churchMemberships.userId, appUser.id),
        eq(churchMemberships.organizationId, organizationId)
      )
    );

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

export async function getBranchMembershipsForClerkUser(
  clerkId: string
): Promise<FirebaseBranchMembership[]> {
  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser) return [];

  const rows = await listChurchMembershipsForUser(appUser.id);
  return rows.map((row) => mapChurchMembership(row, clerkId));
}

/**
 * Approve/reject church join requests.
 * Org owner/org_admin may review any church in their organization.
 * Church-level church_admin may review only their assigned church.
 */
export async function userCanReviewChurchMemberships(
  clerkId: string,
  email: string | undefined,
  churchId: string
): Promise<boolean> {
  if (!isPostgresUuid(churchId)) return false;
  if (isPlatformSuperAdmin(email)) return true;

  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser) return false;

  const [church] = await db
    .select()
    .from(churches)
    .where(eq(churches.id, churchId))
    .limit(1);
  if (!church) return false;

  const orgRow = await getOrgMembershipRow(appUser.id, church.organizationId);
  if (
    orgRow?.status === "active" &&
    roleMeetsMinimum(orgRow.role as MembershipRole, "org_admin")
  ) {
    return true;
  }

  const churchRow = await getChurchMembershipRow(appUser.id, churchId);
  if (!churchRow || churchRow.status !== "active") return false;
  return roleMeetsMinimum(churchRow.role as MembershipRole, "church_admin");
}

export async function userCanManageChurch(
  clerkId: string,
  email: string | undefined,
  churchId: string
): Promise<boolean> {
  if (!isPostgresUuid(churchId)) return false;
  if (isPlatformSuperAdmin(email)) return true;

  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser) return false;

  const [church] = await db
    .select()
    .from(churches)
    .where(eq(churches.id, churchId))
    .limit(1);
  if (!church) return false;

  const orgRow = await getOrgMembershipRow(appUser.id, church.organizationId);
  if (orgRow?.status === "active") return true;

  const churchRow = await getChurchMembershipRow(appUser.id, churchId);
  if (!churchRow || churchRow.status !== "active") return false;
  return roleMeetsMinimum(churchRow.role as MembershipRole, "editor");
}

export async function userCanAccessChurchContent(
  clerkId: string,
  email: string | undefined,
  churchId: string
): Promise<boolean> {
  if (!isPostgresUuid(churchId)) return false;
  if (isPlatformSuperAdmin(email)) return true;

  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser) return false;

  const [church] = await db
    .select()
    .from(churches)
    .where(eq(churches.id, churchId))
    .limit(1);
  if (!church) return false;

  const orgRow = await getOrgMembershipRow(appUser.id, church.organizationId);
  if (orgRow?.status === "active") return true;

  const churchRow = await getChurchMembershipRow(appUser.id, churchId);
  return churchRow?.status === "active";
}

export async function assertCanManageChurch(
  clerkId: string,
  email: string | undefined,
  churchId: string
): Promise<AppUserRow> {
  const allowed = await userCanManageChurch(clerkId, email, churchId);
  if (!allowed) {
    throw new Error("Unauthorized");
  }
  return requireAppUserByClerkId(clerkId);
}

export function profileFromAppUser(row: AppUserRow) {
  return mapAppUserToProfile(row);
}
