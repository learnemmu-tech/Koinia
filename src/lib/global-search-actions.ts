"use server";

import type { TenantScope } from "@/lib/organization/tenant-scope";

import { searchArticles } from "./firebase-article-queries";
import { searchEvents } from "./firebase-event-queries";
import { searchSermons } from "./firebase-sermon-queries";
import { searchSongs } from "./firebase-queries";
import {
  buildGlobalSearchResults,
  type GlobalSearchGroupedResults,
} from "./global-search";

export async function searchGlobal(
  scope: TenantScope,
  searchQuery: string
): Promise<GlobalSearchGroupedResults> {
  const normalized = searchQuery.trim();
  if (!normalized) {
    return { songs: [], sermons: [], articles: [], events: [] };
  }

  const [songs, sermons, articles, events] = await Promise.all([
    searchSongs(scope, normalized),
    searchSermons(scope, normalized),
    searchArticles(scope, normalized),
    searchEvents(scope, normalized),
  ]);

  return buildGlobalSearchResults({ songs, sermons, articles, events });
}
