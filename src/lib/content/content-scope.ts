import { and, eq, sql, type SQL } from "drizzle-orm";
import type { AnyColumn } from "drizzle-orm";

import type { ContentScope } from "@/db/schema/enums";
import type { TenantScope } from "@/lib/organization/tenant-scope";
import { postgresUuidOrEmpty } from "@/lib/postgres/uuid";

export type ContentScopeMode = ContentScope | "tenant";

export type ContentQueryInput = Partial<TenantScope> & {
  contentMode?: ContentScopeMode;
};

export type ResolvedContentQuery =
  | { kind: "platform_public" }
  | { kind: "tenant"; organizationId: string; churchId: string }
  | { kind: "empty" };

export const PUBLIC_PLATFORM_CONTENT_QUERY: ContentQueryInput = {
  contentMode: "platform_public",
  organizationId: "",
  churchId: "",
};

export function resolveContentQuery(input: ContentQueryInput): ResolvedContentQuery {
  if (input.contentMode === "platform_public") {
    return { kind: "platform_public" };
  }

  const churchId =
    postgresUuidOrEmpty(input.churchId) || postgresUuidOrEmpty(input.branchId);
  const organizationId = input.organizationId?.trim() || "";

  if (!churchId || !organizationId) {
    return { kind: "empty" };
  }

  return { kind: "tenant", organizationId, churchId };
}

export function contentScopeWhere(
  columns: {
    contentScope: AnyColumn;
    organizationId: AnyColumn;
    churchId: AnyColumn;
  },
  query: ResolvedContentQuery
): SQL {
  if (query.kind === "empty") {
    return sql`false`;
  }

  if (query.kind === "platform_public") {
    return eq(columns.contentScope, "platform_public");
  }

  return and(
    eq(columns.contentScope, "organization"),
    eq(columns.organizationId, query.organizationId),
    eq(columns.churchId, query.churchId)
  )!;
}

export function tenantContentQuery(
  scope: Partial<TenantScope>
): ContentQueryInput {
  return {
    contentMode: "tenant",
    organizationId: scope.organizationId,
    churchId: scope.churchId,
    branchId: scope.branchId,
  };
}

export function recordMatchesContentQuery(
  record:
    | {
        contentScope?: ContentScope | string | null;
        organizationId?: string | null;
        churchId?: string | null;
      }
    | null
    | undefined,
  input: ContentQueryInput
): boolean {
  if (!record) return false;

  const query = resolveContentQuery(input);
  if (query.kind === "empty") return false;

  const scope = record.contentScope ?? "organization";

  if (query.kind === "platform_public") {
    return scope === "platform_public";
  }

  if (scope !== "organization") return false;

  return (
    record.organizationId?.trim() === query.organizationId &&
    record.churchId?.trim() === query.churchId
  );
}

export function isPlatformPublicContentScope(
  value: string | null | undefined
): boolean {
  return value === "platform_public";
}

export function contentCacheKey(query: ContentQueryInput): string {
  const resolved = resolveContentQuery(query);
  if (resolved.kind === "platform_public") return "platform_public";
  if (resolved.kind === "tenant") {
    return `tenant:${resolved.organizationId}:${resolved.churchId}`;
  }
  return "empty";
}

/** Content types intentionally shown on the public FaithConnectHub showcase. */
export const PLATFORM_PUBLIC_SHOWCASE_TYPES = [
  "songs",
  "sermons",
  "articles",
  "shorts",
  "events",
  "donations",
] as const;

/** Prayer requests are tenant-scoped only — never platform public showcase. */
export const TENANT_ONLY_CONTENT_TYPES = ["prayerRequests"] as const;
