import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { churchMemberships, churches, organizationMemberships } from "@/db/schema";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";
import { organizationAllowsWorkspaceAccess } from "@/lib/auth/organization-workspace-access-server";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import { isPostgresUuid } from "@/lib/postgres/uuid";
import { roleMeetsMinimum, type MembershipRole } from "@/types/membership";

export type BookAdminScope =
  | {
      kind: "org";
      organizationId: string;
      userId: string;
    }
  | {
      kind: "church";
      organizationId: string;
      churchIds: string[];
      userId: string;
    };

export async function resolveBookAdminScope(
  clerkId: string
): Promise<BookAdminScope | null> {
  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser) return null;
  if (isPlatformSuperAdmin(appUser.platformRole)) {
    if (!appUser.organizationId) return null;
    return {
      kind: "org",
      organizationId: appUser.organizationId,
      userId: appUser.id,
    };
  }

  const orgRows = await db
    .select()
    .from(organizationMemberships)
    .where(
      and(
        eq(organizationMemberships.userId, appUser.id),
        eq(organizationMemberships.status, "active")
      )
    );

  const orgAdmin = orgRows.find((row) =>
    roleMeetsMinimum(row.role as MembershipRole, "org_admin")
  );
  if (orgAdmin) {
    if (
      !(await organizationAllowsWorkspaceAccess(
        orgAdmin.organizationId,
        appUser.platformRole
      ))
    ) {
      return null;
    }
    return {
      kind: "org",
      organizationId: orgAdmin.organizationId,
      userId: appUser.id,
    };
  }

  const churchRows = await db
    .select({
      churchId: churchMemberships.churchId,
      organizationId: churchMemberships.organizationId,
      role: churchMemberships.role,
    })
    .from(churchMemberships)
    .where(
      and(
        eq(churchMemberships.userId, appUser.id),
        eq(churchMemberships.status, "active")
      )
    );

  const managed = churchRows.filter((row) =>
    roleMeetsMinimum(row.role as MembershipRole, "church_admin")
  );
  if (managed.length === 0) return null;

  const organizationId = managed[0]!.organizationId;
  if (
    !(await organizationAllowsWorkspaceAccess(
      organizationId,
      appUser.platformRole
    ))
  ) {
    return null;
  }

  return {
    kind: "church",
    organizationId,
    churchIds: managed.map((row) => row.churchId),
    userId: appUser.id,
  };
}

export function scopeAllowsChurch(
  scope: BookAdminScope,
  churchId: string
): boolean {
  if (scope.kind === "org") return true;
  return scope.churchIds.includes(churchId);
}

export function scopeAllowsBook(
  scope: BookAdminScope,
  book: { organizationId: string; churchId: string }
): boolean {
  if (book.organizationId !== scope.organizationId) return false;
  return scopeAllowsChurch(scope, book.churchId);
}

export async function userCanAccessBookAsMember(
  clerkId: string | null | undefined,
  book: { organizationId: string; churchId: string }
): Promise<boolean> {
  if (!clerkId) return false;
  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser) return false;
  if (isPlatformSuperAdmin(appUser.platformRole)) return true;

  const orgRow = await db
    .select({ id: organizationMemberships.id })
    .from(organizationMemberships)
    .where(
      and(
        eq(organizationMemberships.userId, appUser.id),
        eq(organizationMemberships.organizationId, book.organizationId),
        eq(organizationMemberships.status, "active")
      )
    )
    .limit(1);
  if (orgRow[0]) return true;

  const churchRow = await db
    .select({ id: churchMemberships.id })
    .from(churchMemberships)
    .where(
      and(
        eq(churchMemberships.userId, appUser.id),
        eq(churchMemberships.churchId, book.churchId),
        eq(churchMemberships.status, "active")
      )
    )
    .limit(1);
  return Boolean(churchRow[0]);
}

export async function assertChurchInOrganization(
  churchId: string,
  organizationId: string
): Promise<boolean> {
  if (!isPostgresUuid(churchId) || !isPostgresUuid(organizationId)) return false;
  const [row] = await db
    .select({ id: churches.id })
    .from(churches)
    .where(
      and(eq(churches.id, churchId), eq(churches.organizationId, organizationId))
    )
    .limit(1);
  return Boolean(row);
}

export async function listChurchesForBookAdmin(scope: BookAdminScope) {
  if (scope.kind === "org") {
    return db
      .select({ id: churches.id, name: churches.name })
      .from(churches)
      .where(eq(churches.organizationId, scope.organizationId));
  }
  if (scope.churchIds.length === 0) return [];
  return db
    .select({ id: churches.id, name: churches.name })
    .from(churches)
    .where(inArray(churches.id, scope.churchIds));
}

export async function listCatalogMemberChurchIds(
  clerkId: string | null | undefined
): Promise<string[]> {
  if (!clerkId) return [];
  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser) return [];

  const ids = new Set<string>();
  const churchRows = await db
    .select({ churchId: churchMemberships.churchId })
    .from(churchMemberships)
    .where(
      and(
        eq(churchMemberships.userId, appUser.id),
        eq(churchMemberships.status, "active")
      )
    );
  for (const row of churchRows) ids.add(row.churchId);

  const orgRows = await db
    .select({ organizationId: organizationMemberships.organizationId })
    .from(organizationMemberships)
    .where(
      and(
        eq(organizationMemberships.userId, appUser.id),
        eq(organizationMemberships.status, "active")
      )
    );
  const organizationIds = orgRows.map((row) => row.organizationId);
  if (organizationIds.length > 0) {
    const orgChurches = await db
      .select({ id: churches.id })
      .from(churches)
      .where(inArray(churches.organizationId, organizationIds));
    for (const church of orgChurches) ids.add(church.id);
  }

  return [...ids];
}
