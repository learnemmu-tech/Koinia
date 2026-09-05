import "server-only";

import {
  createSermon as insertSermon,
  deleteSermon as removeSermon,
  getSermonById as loadSermonById,
  getSermonsByIds as loadSermonsByIds,
  listSermons,
  updateSermon as saveSermon,
} from "@/lib/postgres/features";
import type { TenantScope } from "@/lib/organization/tenant-scope";
import type {
  CreateSermonInput,
  FirebaseSermon,
  UpdateSermonInput,
} from "@/types/firebase-sermon";

export async function getSermons(scope: TenantScope): Promise<FirebaseSermon[]> {
  return listSermons(scope);
}

export async function getPublishedSermons(
  scope: TenantScope
): Promise<FirebaseSermon[]> {
  return (await listSermons(scope)).filter((sermon) => sermon.isPublished);
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
  scope: TenantScope,
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
