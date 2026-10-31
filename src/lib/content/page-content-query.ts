import "server-only";

import { cache } from "react";

import { auth } from "@clerk/nextjs/server";

import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";
import { resolveAuthenticatedChurchScope } from "@/lib/organization/resolve-current-church-server";
import type { TenantScope } from "@/lib/organization/tenant-scope";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";

import { getRequestChurchUrlScope } from "@/lib/templates/church-url-request";

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

import { logRequestStage, traceRequestStage } from "@/lib/nav-trace-server";

async function resolveAuthenticatedTenantScope(
  userId: string
): Promise<TenantScope | null> {
  return traceRequestStage("tenant.scope", () =>
    resolveAuthenticatedChurchScope(userId)
  );
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
    const totalStarted = Date.now();
    const { userId } = await traceRequestStage("resolve.auth", () => auth());

    const urlChurch = await getRequestChurchUrlScope();
    if (urlChurch) {
      await logRequestStage("resolve.content", totalStarted, { source: "url" });
      return {
        contentQuery: tenantContentQuery(urlChurch),
        isPlatformPublic: false,
        tenantScope: {
          organizationId: urlChurch.organizationId,
          churchId: urlChurch.churchId,
        },
      };
    }

    if (!userId) {
      await logRequestStage("resolve.content", totalStarted, {
        source: options.tenantOnly ? "anonymous-empty" : "platform-public",
      });
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
        await logRequestStage("resolve.content", totalStarted, { source: "super-admin" });
        return {
          contentQuery: PUBLIC_PLATFORM_CONTENT_QUERY,
          isPlatformPublic: true,
          tenantScope: null,
        };
      }

      await logRequestStage("resolve.content", totalStarted, { source: "empty-tenant" });
      return {
        contentQuery: EMPTY_TENANT_QUERY,
        isPlatformPublic: false,
        tenantScope: null,
      };
    }

    await logRequestStage("resolve.content", totalStarted, { source: "tenant" });
    return {
      contentQuery: tenantContentQuery(tenantScope),
      isPlatformPublic: false,
      tenantScope,
    };
  }
);
