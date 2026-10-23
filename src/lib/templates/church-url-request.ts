import "server-only";

import { headers } from "next/headers";

import { parseChurchWebsiteSlugFromPath } from "@/lib/auth/auth-paths";
import type { TenantScope } from "@/lib/organization/tenant-scope";
import { getChurchBySlug } from "@/lib/postgres/tenants";

const PATHNAME_HEADER = "x-koinia-pathname";

export function churchUrlPathnameHeader(): string {
  return PATHNAME_HEADER;
}

/**
 * Organization and church for the public `/c/[slug]` request.
 * Null on every other route, so the existing app queries stay unchanged.
 */
export async function getRequestChurchUrlScope(): Promise<
  (TenantScope & { name: string }) | null
> {
  const headerStore = await headers();
  const slug = parseChurchWebsiteSlugFromPath(
    headerStore.get(PATHNAME_HEADER)
  );
  if (!slug) return null;

  const church = await getChurchBySlug(slug);
  const organizationId = church?.organizationId?.trim() ?? "";
  if (!church?.isActive || !organizationId) return null;

  return {
    organizationId,
    churchId: church.id,
    name: church.name,
  };
}
