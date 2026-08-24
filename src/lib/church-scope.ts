/**
 * Multi-tenant church scoping utilities.
 * All content queries must filter through these helpers — never load all churches.
 */

import { MULTI_CHURCH_ENABLED } from "./feature-flags";

/** Fallback for legacy documents created before multi-church rollout. */
export function getLegacyDefaultChurchId(): string {
  return (
    process.env.DEFAULT_CHURCH_ID?.trim() ||
    process.env.NEXT_PUBLIC_DEFAULT_CHURCH_ID?.trim() ||
    ""
  );
}

/** Church id stored on new content when multi-church is off or scope is missing. */
export function resolveChurchIdForWrite(
  churchId: string | null | undefined
): string {
  const trimmed = String(churchId ?? "").trim();
  if (trimmed) return trimmed;
  return getLegacyDefaultChurchId() || "default";
}

export function resolveDocumentChurchId(
  data: Record<string, unknown>
): string {
  const explicit = String(data.churchId ?? "").trim();
  if (explicit) return explicit;
  return getLegacyDefaultChurchId();
}

export function documentBelongsToChurch(
  data: Record<string, unknown>,
  churchId: string
): boolean {
  if (!MULTI_CHURCH_ENABLED) return true;
  if (!churchId.trim()) return false;
  const docChurchId = resolveDocumentChurchId(data);
  if (!docChurchId) return false;
  return docChurchId === churchId;
}

export function filterRecordsByChurch<T extends { churchId?: string }>(
  records: T[],
  churchId: string
): T[] {
  const scopedId = churchId.trim();
  if (!scopedId) return records;

  return records.filter((record) => record.churchId?.trim() === scopedId);
}

export function slugifyChurchSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function isValidChurchSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 2;
}

/** Cached/detail lookups — skip church match when multi-church is disabled. */
export function recordMatchesChurchScope<T extends { churchId?: string }>(
  record: T | null | undefined,
  churchId: string
): record is T {
  if (!record) return false;
  if (!MULTI_CHURCH_ENABLED || !churchId.trim()) return true;
  const legacyId = getLegacyDefaultChurchId();
  const recordChurchId = record.churchId?.trim() || legacyId;
  return recordChurchId === churchId;
}
