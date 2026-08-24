"use server";



import type { TenantScope } from "@/lib/organization/tenant-scope";

import { getWorshipCatalogCached } from "@/lib/cached-worship-data";



export async function fetchWorshipCatalogAction(scope: TenantScope) {

  return getWorshipCatalogCached(scope);

}


