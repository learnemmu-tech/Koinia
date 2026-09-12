import "server-only";

import {
  createSermon as insertSermon,
  deleteSermon as removeSermon,
  getSermonById as loadSermonById,
  getSermonsByIds as loadSermonsByIds,
  listSermons,
  updateSermon as saveSermon,
} from "@/lib/postgres/features";
import type { ContentQueryInput } from "@/lib/content/content-scope";
import type {
  CreateSermonInput,
  FirebaseSermon,
  UpdateSermonInput,
} from "@/types/firebase-sermon";

export async function getSermons(scope: ContentQueryInput): Promise<FirebaseSermon[]> {
  return listSermons(scope);
}

export async function getPublishedSermons(
  scope: ContentQueryInput,
  options?: { limit?: number }
): Promise<FirebaseSermon[]> {
  return listSermons(scope, {
    publishedOnly: true,
    limit: options?.limit,
    // Catalog cards do not need creator Clerk ids — skip an extra Neon round-trip.
    resolveCreatorClerkIds: false,
  });
}

export async function getSermonById(
  sermonId: string
): Promise<FirebaseSermon | null> {
  return loadSermonById(sermonId);
}

export async function getSermonsByIds(ids: string[]): Promise<FirebaseSermon[]> {
  return loadSermonsByIds(ids);
}

export async function searchSermons(
  scope: ContentQueryInput,
  searchQuery: string
): Promise<FirebaseSermon[]> {
  const normalized = searchQuery.trim().toLowerCase();
  if (!normalized) return [];
  const sermons = await getPublishedSermons(scope);
  return sermons.filter((sermon) =>
    [sermon.title, sermon.subtitle ?? "", sermon.speaker, sermon.scriptureReference]
      .join(" ")
      .toLowerCase()
      .includes(normalized)
  );
}

export async function createSermon(input: CreateSermonInput): Promise<string> {
  return insertSermon(input);
}

export async function updateSermon(
  sermonId: string,
  updates: UpdateSermonInput
): Promise<void> {
  await saveSermon(sermonId, updates);
}

export async function deleteSermon(sermonId: string): Promise<void> {
  await removeSermon(sermonId);
}
