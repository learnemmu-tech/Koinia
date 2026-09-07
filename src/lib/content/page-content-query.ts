import "server-only";

import { cache } from "react";

import { auth } from "@clerk/nextjs/server";

import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";
import {
  getActiveBranchIdFromCookies,
  getActiveChurchIdFromCookies,
} from "@/lib/church-server";
import { getChurchById } from "@/lib/church-queries";
import type { TenantScope } from "@/lib/organization/tenant-scope";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import {
  listChurchMembershipsForUser,
  userCanAccessChurchContent,
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

async function resolveAuthenticatedTenantScope(
  userId: string,
  email: string | undefined
): Promise<TenantScope | null> {
  const appUser = await getAppUserByClerkId(userId);
  if (!appUser) return null;

  if (isPlatformSuperAdmin(appUser.platformRole)) {
    return null;
  }

  if (appUser.needsChurchOnboarding) {
    return null;
  }

  const branchFromCookie = await getActiveBranchIdFromCookies();
  const profileOrganizationId = appUser.organizationId?.trim() || "";
  const profileChurchId = appUser.activeChurchId?.trim() || "";

  const cookieChurchId = (await getActiveChurchIdFromCookies())?.trim() || "";
  const candidateChurchIds = [cookieChurchId, profileChurchId].filter(Boolean);

  const seen = new Set<string>();

  for (const rawChurchId of candidateChurchIds) {
    const churchId = postgresUuidOrEmpty(rawChurchId);
    if (!churchId || seen.has(churchId)) continue;
    seen.add(churchId);

    const [allowed, church] = await Promise.all([
      userCanAccessChurchContent(userId, email, churchId),
      getChurchById(churchId),
    ]);
    if (!allowed) continue;
    if (!church?.isActive) continue;

    const organizationId =
      church.organizationId?.trim() || profileOrganizationId;
    if (!organizationId) continue;

    const branchId =
      postgresUuidOrEmpty(branchFromCookie) ||
      postgresUuidOrEmpty(church.defaultBranchId);

    return {
      organizationId,
      churchId: church.id,
      branchId: branchId || undefined,
    };
  }

  const memberships = await listChurchMembershipsForUser(appUser.id);
  const activeMemberships = memberships.filter((row) => row.status === "active");

  for (const membership of activeMemberships) {
    const churchId = postgresUuidOrEmpty(membership.churchId);
    if (!churchId || seen.has(churchId)) continue;
    seen.add(churchId);

    const [allowed, church] = await Promise.all([
      userCanAccessChurchContent(userId, email, churchId),
      getChurchById(churchId),
    ]);
    if (!allowed) continue;
    if (!church?.isActive) continue;

    const organizationId =
      church.organizationId?.trim() ||
      membership.organizationId?.trim() ||
      profileOrganizationId;
    if (!organizationId) continue;

    const branchId =
      postgresUuidOrEmpty(branchFromCookie) ||
      postgresUuidOrEmpty(church.defaultBranchId);

    return {
      organizationId,
      churchId: church.id,
      branchId: branchId || undefined,
    };
  }

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
    const { userId, sessionClaims } = await auth();
    const email = sessionClaims?.email as string | undefined;

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

    const tenantScope = await resolveAuthenticatedTenantScope(userId, email);

    if (!tenantScope?.organizationId?.trim() || !tenantScope.churchId?.trim()) {
      const appUser = await getAppUserByClerkId(userId);
      if (isPlatformSuperAdmin(appUser?.platformRole) && !options.tenantOnly) {
        return {
          contentQuery: PUBLIC_PLATFORM_CONTENT_QUERY,
          isPlatformPublic: true,
          tenantScope: null,
        };
      }

      return {
        contentQuery: EMPTY_TENANT_QUERY,
        isPlatformPublic: false,
        tenantScope: null,
      };
    }

    return {
      contentQuery: tenantContentQuery(tenantScope),
      isPlatformPublic: false,
      tenantScope,
    };
  }
);
