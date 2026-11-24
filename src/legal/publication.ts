import type { LegalReviewStatus, StoredLegalVersion } from "./types";

const PUBLIC_STATUSES: LegalReviewStatus[] = ["published"];

export function isPublicLegalStatus(status: string): boolean {
  return PUBLIC_STATUSES.includes(status as LegalReviewStatus);
}

/** Archived versions stay readable. Drafts and unapproved copies do not. */
export function isHistoricallyReadableStatus(status: string): boolean {
  return status === "published" || status === "archived";
}

export function selectCurrentPublished<T extends { reviewStatus: string }>(
  versions: T[]
): T | null {
  return versions.find((version) => version.reviewStatus === "published") ?? null;
}

export function acceptanceIdempotencyKey(input: {
  userId: string;
  versionId: string;
  action: string;
}): string {
  return `${input.userId}:${input.versionId}:${input.action}`;
}

export function requiresReacceptance(input: {
  materialChange: boolean;
  priorVersionId: string | null;
  nextVersionId: string;
}): boolean {
  if (!input.materialChange) return false;
  return input.priorVersionId !== input.nextVersionId;
}

export function canPublish(input: {
  actorIsSuperAdmin: boolean;
  confirmation: string;
  approverName: string;
}): { ok: true } | { ok: false; reason: string } {
  if (!input.actorIsSuperAdmin) {
    return { ok: false, reason: "Only a platform super admin can publish legal documents." };
  }
  if (input.confirmation !== "PUBLISH") {
    return { ok: false, reason: "Publishing requires explicit confirmation." };
  }
  if (input.approverName.trim().length < 2) {
    return { ok: false, reason: "Record the name of the person approving publication." };
  }
  return { ok: true };
}

export function publicVersionOrNull(
  version: StoredLegalVersion | null
): StoredLegalVersion | null {
  if (!version || !isPublicLegalStatus(version.reviewStatus)) return null;
  return version;
}
