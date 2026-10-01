import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";

import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";
import { organizationAllowsWorkspaceAccess } from "@/lib/auth/organization-workspace-access-server";
import {
  ACTIVE_BRANCH_COOKIE_NAME,
  readActiveBranchIdFromCookieValue,
} from "@/lib/branch-cookies";
import {
  ACTIVE_CHURCH_COOKIE_NAME,
  readActiveChurchIdFromCookieValue,
} from "@/lib/church-cookies";
import { getChurchById } from "@/lib/church-queries";
import { pickCurrentChurchId } from "@/lib/organization/pick-current-church-id";
import type { TenantScope } from "@/lib/organization/tenant-scope";
import { getAppUserByClerkId, type AppUserRow } from "@/lib/postgres/app-user";
import { getActiveTemplateForChurch } from "@/lib/postgres/church-websites";
import {
  getChurchMembershipRow,
  getOrgMembershipRow,
  listChurchMembershipsForUser,
} from "@/lib/postgres/session";
import { postgresUuidOrEmpty } from "@/lib/postgres/uuid";
import type { TemplateId } from "@/lib/templates/types";
import type { FirebaseChurch } from "@/types/firebase-church";

async function canAccessResolvedChurch(
  appUser: AppUserRow,
  church: { id: string; organizationId?: string; isActive: boolean }
): Promise<boolean> {
  if (isPlatformSuperAdmin(appUser.platformRole)) return true;
  if (!church.isActive) return false;
  const organizationId = church.organizationId?.trim();
  if (!organizationId) return false;

  const [orgAllowed, orgRow, churchRow] = await Promise.all([
    organizationAllowsWorkspaceAccess(organizationId, appUser.platformRole),
    getOrgMembershipRow(appUser.id, organizationId),
    getChurchMembershipRow(appUser.id, church.id),
  ]);
  if (!orgAllowed) return false;
  if (orgRow?.status === "active") return true;
  return churchRow?.status === "active";
}

async function readChurchSelectionCookies(): Promise<{
  cookieChurchId: string | null;
  branchFromCookie: string | null;
}> {
  const cookieStore = await cookies();
  return {
    cookieChurchId: readActiveChurchIdFromCookieValue(
      cookieStore.get(ACTIVE_CHURCH_COOKIE_NAME)?.value
    ),
    branchFromCookie: readActiveBranchIdFromCookieValue(
      cookieStore.get(ACTIVE_BRANCH_COOKIE_NAME)?.value
    ),
  };
}

async function scopeFromChurch(
  church: FirebaseChurch,
  profileOrganizationId: string,
  branchFromCookie: string | null
): Promise<TenantScope | null> {
  const organizationId =
    church.organizationId?.trim() || profileOrganizationId;
  if (!organizationId) return null;

  const branchId =
    postgresUuidOrEmpty(branchFromCookie) ||
    postgresUuidOrEmpty(church.defaultBranchId);

  return {
    organizationId,
    churchId: church.id,
    branchId: branchId || undefined,
  };
}

/**
 * Authoritative current church for an authenticated member.
 * Source of truth: users.activeChurchId → membership → church.
 * Cookie is only a hint when the profile pointer is missing.
 */
export const resolveAuthenticatedChurchScope = cache(
  async function resolveAuthenticatedChurchScope(
    userId: string
  ): Promise<TenantScope | null> {
    const appUser = await getAppUserByClerkId(userId);
    if (!appUser) return null;
    if (isPlatformSuperAdmin(appUser.platformRole)) return null;
    if (appUser.needsChurchOnboarding) return null;

    const { cookieChurchId, branchFromCookie } =
      await readChurchSelectionCookies();
    const profileOrganizationId = appUser.organizationId?.trim() || "";
    const profileChurchId = postgresUuidOrEmpty(appUser.activeChurchId);
    const cookieId = postgresUuidOrEmpty(cookieChurchId);

    const tryChurchId = async (
      rawChurchId: string
    ): Promise<TenantScope | null> => {
      const churchId = postgresUuidOrEmpty(rawChurchId);
      if (!churchId) return null;
      const church = await getChurchById(churchId);
      if (!church?.isActive) return null;
      if (!(await canAccessResolvedChurch(appUser, church))) return null;
      return scopeFromChurch(church, profileOrganizationId, branchFromCookie);
    };

    const fromProfile = await tryChurchId(profileChurchId);
    if (fromProfile) return fromProfile;

    const fromCookie = await tryChurchId(cookieId);
    if (fromCookie) return fromCookie;

    const memberships = await listChurchMembershipsForUser(appUser.id);
    const activeMemberships = memberships.filter((row) => row.status === "active");
    const accessibleIds: string[] = [];

    for (const membership of activeMemberships) {
      const churchId = postgresUuidOrEmpty(membership.churchId);
      if (!churchId) continue;
      const church = await getChurchById(churchId);
      if (!church?.isActive) continue;
      const organizationId =
        church.organizationId?.trim() ||
        membership.organizationId?.trim() ||
        profileOrganizationId;
      if (!organizationId) continue;
      const orgAllowed = await organizationAllowsWorkspaceAccess(
        organizationId,
        appUser.platformRole
      );
      if (!orgAllowed) continue;
      accessibleIds.push(church.id);
    }

    const picked = pickCurrentChurchId({
      profileChurchId,
      cookieChurchId: cookieId,
      accessibleChurchIds: accessibleIds,
    });

    return tryChurchId(picked);
  }
);

export const resolveCurrentMemberChurchContext = cache(
  async function resolveCurrentMemberChurchContext(): Promise<{
    scope: TenantScope;
    church: FirebaseChurch | null;
    activeTemplate: TemplateId | null;
  }> {
    const { userId } = await auth();

    if (!userId) {
      return {
        scope: { organizationId: "", churchId: "" },
        church: null,
        activeTemplate: null,
      };
    }

    const resolved = await resolveAuthenticatedChurchScope(userId);
    if (!resolved?.churchId) {
      return {
        scope: { organizationId: "", churchId: "" },
        church: null,
        activeTemplate: null,
      };
    }

    const church = await getChurchById(resolved.churchId);
    const organizationId =
      church?.organizationId?.trim() || resolved.organizationId;
    const activeTemplate =
      church && organizationId
        ? await getActiveTemplateForChurch(church.id, organizationId)
        : null;

    return {
      scope: {
        organizationId,
        churchId: church?.id || resolved.churchId,
        branchId: resolved.branchId,
      },
      church: church
        ? {
            ...church,
            ...(activeTemplate ? { activeTemplate } : {}),
          }
        : null,
      activeTemplate,
    };
  }
);
