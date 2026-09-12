"use server";

import { resolvePageContentQuery } from "@/lib/content/page-content-query";
import { getWorshipCatalogCached } from "@/lib/cached-worship-data";

/**
 * Search catalog uses server-resolved tenant scope only.
 * Client-supplied organizationId/churchId are ignored (prevents cross-tenant IDOR).
 */
export async function fetchWorshipCatalogAction() {
  const { contentQuery } = await resolvePageContentQuery();
  return getWorshipCatalogCached(contentQuery);
}
