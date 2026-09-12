import "server-only";

import { cache } from "react";

import { auth } from "@clerk/nextjs/server";

import { organizationAllowsWorkspaceAccess } from "@/lib/auth/organization-workspace-access-server";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";
import {
  getActiveBranchIdFromCookies,
  getActiveChurchIdFromCookies,
} from "@/lib/church-server";
import { getChurchById } from "@/lib/church-queries";
import type { TenantScope } from "@/lib/organization/tenant-scope";
import { getAppUserByClerkId, type AppUserRow } from "@/lib/postgres/app-user";
import {
  getChurchMembershipRow,
  getOrgMembershipRow,
  listChurchMembershipsForUser,
} from "@/lib/postgres/session";
import { postgresUuidOrEmpty } from "@/lib/postgres/uuid";

import {
  PUBLIC_PLATFORM_CONTENT_QUERY,
  tenantContentQuery,
  type ContentQueryInput,
} from "./content-scope";

export type PageContentContext = {
  contentQuery: ContentQueryInput;
  /** True when the page should load FaithConnectHub platform showcase content. */
  isPlatformPublic: boolean;
  /** Trusted tenant scope when authenticated tenant content is shown. */
  tenantScope: TenantScope | null;
};

export type ResolvePageContentQueryOptions = {
  /**
   * Tenant-only pages (e.g. prayer requests) never fall back to platform public
   * for anonymous visitors — they receive an empty tenant query instead.
   */
  tenantOnly?: boolean;
};

const EMPTY_TENANT_QUERY = tenantContentQuery({
  organizationId: "",
  churchId: "",
});

const PERF_TIMING = process.env.PERF_TIMING === "1";

function perfLog(label: string, startedAt: number) {
  if (!PERF_TIMING) return;
  console.info(`[perf] ${label}: ${Math.round(performance.now() - startedAt)}ms`);
}

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

async function resolveAuthenticatedTenantScope(
  userId: string
): Promise<TenantScope | null> {
  const scopeStarted = performance.now();

  // Stage 1: user + cookies in parallel (previously serial user → cookies).
  const userStarted = performance.now();
  const [appUser, branchFromCookie, cookieChurchId] = await Promise.all([
    getAppUserByClerkId(userId),
    getActiveBranchIdFromCookies(),
    getActiveChurchIdFromCookies(),
  ]);
  perfLog("tenant.user+cookies", userStarted);

  if (!appUser) return null;

  if (isPlatformSuperAdmin(appUser.platformRole)) {
    return null;
  }

  if (appUser.needsChurchOnboarding) {
    return null;
  }

  const profileOrganizationId = appUser.organizationId?.trim() || "";
  const profileChurchId = appUser.activeChurchId?.trim() || "";

  const candidateChurchIds = [
    cookieChurchId?.trim() || "",
    profileChurchId,
  ].filter(Boolean);

  const seen = new Set<string>();

  for (const rawChurchId of candidateChurchIds) {
    const churchId = postgresUuidOrEmpty(rawChurchId);
    if (!churchId || seen.has(churchId)) continue;
    seen.add(churchId);

    // Stage 2: one church fetch (no duplicate access helper re-fetch).
    const churchStarted = performance.now();
    const church = await getChurchById(churchId);
    perfLog("tenant.church", churchStarted);
    if (!church?.isActive) continue;

    const accessStarted = performance.now();
    const allowed = await canAccessResolvedChurch(appUser, church);
    perfLog("tenant.membership", accessStarted);
    if (!allowed) continue;

    const organizationId =
      church.organizationId?.trim() || profileOrganizationId;
    if (!organizationId) continue;

    const branchId =
      postgresUuidOrEmpty(branchFromCookie) ||
      postgresUuidOrEmpty(church.defaultBranchId);

    perfLog("tenant.total", scopeStarted);
    return {
      organizationId,
      churchId: church.id,
      branchId: branchId || undefined,
    };
  }

  const membershipsStarted = performance.now();
  const memberships = await listChurchMembershipsForUser(appUser.id);
  perfLog("tenant.membershipsList", membershipsStarted);
  const activeMemberships = memberships.filter((row) => row.status === "active");

  // Membership rows already prove church access; only verify org workspace
  // status + active church (avoids repeating the full authz waterfall).
  for (const membership of activeMemberships) {
    const churchId = postgresUuidOrEmpty(membership.churchId);
    if (!churchId || seen.has(churchId)) continue;
    seen.add(churchId);

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

    const branchId =
      postgresUuidOrEmpty(branchFromCookie) ||
      postgresUuidOrEmpty(church.defaultBranchId);

    perfLog("tenant.total", scopeStarted);
    return {
      organizationId,
      churchId: church.id,
      branchId: branchId || undefined,
    };
  }

  perfLog("tenant.total", scopeStarted);
  return null;
}

/**
 * Resolves whether a public-facing page should load platform showcase content
 * or authenticated tenant workspace content.
 *
 * Anonymous visitors → platform public (unless tenantOnly).
 * Authenticated tenant members → tenant scope validated server-side.
 * Platform SuperAdmin on public pages → platform public (not tenant).
 * Users without a completed workspace → empty tenant query (not platform).
 */
export const resolvePageContentQuery = cache(
  async (
    options: ResolvePageContentQueryOptions = {}
  ): Promise<PageContentContext> => {
    const totalStarted = performance.now();
    const authStarted = performance.now();
    const { userId } = await auth();
    perfLog("resolve.clerkAuth", authStarted);

    if (!userId) {
      if (options.tenantOnly) {
        return {
          contentQuery: EMPTY_TENANT_QUERY,
          isPlatformPublic: false,
          tenantScope: null,
        };
      }

      return {
        contentQuery: PUBLIC_PLATFORM_CONTENT_QUERY,
        isPlatformPublic: true,
        tenantScope: null,
      };
    }

    const tenantScope = await resolveAuthenticatedTenantScope(userId);

    if (!tenantScope?.organizationId?.trim() || !tenantScope.churchId?.trim()) {
      // getAppUserByClerkId is React-cached for this request.
      const appUser = await getAppUserByClerkId(userId);
      if (isPlatformSuperAdmin(appUser?.platformRole) && !options.tenantOnly) {
        perfLog("resolve.total", totalStarted);
        return {
          contentQuery: PUBLIC_PLATFORM_CONTENT_QUERY,
          isPlatformPublic: true,
          tenantScope: null,
        };
      }

      perfLog("resolve.total", totalStarted);
      return {
        contentQuery: EMPTY_TENANT_QUERY,
        isPlatformPublic: false,
        tenantScope: null,
      };
    }

    perfLog("resolve.total", totalStarted);
    return {
      contentQuery: tenantContentQuery(tenantScope),
      isPlatformPublic: false,
      tenantScope,
    };
  }
);
