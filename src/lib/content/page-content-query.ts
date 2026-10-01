import "server-only";

import { cache } from "react";

import { auth } from "@clerk/nextjs/server";

import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";
import { resolveAuthenticatedChurchScope } from "@/lib/organization/resolve-current-church-server";
import type { TenantScope } from "@/lib/organization/tenant-scope";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";

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

async function resolveAuthenticatedTenantScope(
  userId: string
): Promise<TenantScope | null> {
  const scopeStarted = performance.now();
  const scope = await resolveAuthenticatedChurchScope(userId);
  perfLog("tenant.total", scopeStarted);
  return scope;
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
