import type { FirebaseSermon } from "@/types/firebase-sermon";

import { resolveDocumentChurchId } from "./church-scope";
import { toMillis } from "./firebase-utils";

/** Current Firestore collection for sermons. */
export const SERMONS_COLLECTION = "sermons";

/**
 * Pre-refactor collection path. Documents may still live here until migrated.
 * Remove after all records are copied to {@link SERMONS_COLLECTION}.
 */
export const LEGACY_SERMONS_COLLECTION = "ceremonies";

export const SERMON_READ_COLLECTIONS = [
  SERMONS_COLLECTION,
  LEGACY_SERMONS_COLLECTION,
] as const;

function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((tag) => String(tag).trim()).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

export function normalizeSermonFromFirestore(
  id: string,
  data: Record<string, unknown>
): FirebaseSermon {
  const rawCover = String(data.coverImage ?? data.imageUrl ?? "").trim();
  const legacyBody = String(data.description ?? "").trim();
  const content = String(data.content ?? legacyBody).trim();
  const shortDescription =
    String(data.shortDescription ?? "").trim() ||
    (legacyBody && !data.content ? legacyBody.slice(0, 160) : "");

  return {
    id,
    churchId: resolveDocumentChurchId(data),
    title: String(data.title ?? ""),
    subtitle: String(data.subtitle ?? "").trim() || undefined,
    scriptureReference: String(data.scriptureReference ?? "").trim(),
    speaker: String(data.speaker ?? data.createdBy ?? "").trim(),
    shortDescription,
    content,
    tags: normalizeTags(data.tags),
    youtubeUrl: String(data.youtubeUrl ?? data.videoUrl ?? "").trim() || undefined,
    audioUrl: String(data.audioUrl ?? data.audioFileUrl ?? "").trim() || undefined,
    coverImage: rawCover || undefined,
    dateCreated: toMillis(data.dateCreated ?? data.createdAt),
    createdBy: String(data.createdBy ?? ""),
    isPublished: resolveIsPublished(data),
  };
}

/** Strips sermon body for list/search payloads. */
export function toSermonListItem(sermon: FirebaseSermon): FirebaseSermon {
  return {
    ...sermon,
    content: "",
  };
}

/** Legacy docs without the field were visible before the publish flag existed. */
function resolveIsPublished(data: Record<string, unknown>): boolean {
  if (typeof data.isPublished === "boolean") return data.isPublished;
  return true;
}

export function mergeSermonsById(
  collections: FirebaseSermon[][]
): FirebaseSermon[] {
  const byId = new Map<string, FirebaseSermon>();

  for (const sermons of collections) {
    for (const sermon of sermons) {
      byId.set(sermon.id, sermon);
    }
  }

  return Array.from(byId.values()).sort(
    (a, b) => b.dateCreated - a.dateCreated
  );
}

export function logSermonFetchDebug(
  results: { collection: string; count: number; error?: unknown }[]
): void {
  if (process.env.NODE_ENV === "production") return;

  for (const { collection, count, error } of results) {
    if (error) {
      console.error(`[sermons] Firestore read failed`, { collection, error });
    } else {
      console.info(`[sermons] Firestore read ok`, { collection, count });
    }
  }
}
