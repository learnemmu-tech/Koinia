"use server";



import type { ContentQueryInput } from "@/lib/content/content-scope";

import { getWorshipCatalogCached } from "@/lib/cached-worship-data";

export async function fetchWorshipCatalogAction(query: ContentQueryInput) {
  return getWorshipCatalogCached(query);
}


