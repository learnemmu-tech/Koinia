import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  consentPreferences,
  legalAcceptances,
  legalDocumentVersions,
  legalReviewEvents,
  privacyRequestEvents,
  privacyRequests,
} from "@/db/schema";
import { getLegalDraft } from "@/legal/documents";
import { acceptanceIdempotencyKey, canPublish } from "@/legal/publication";
import type { LegalSection, StoredLegalVersion } from "@/legal/types";

function mapVersion(row: typeof legalDocumentVersions.$inferSelect): StoredLegalVersion {
  return {
    id: row.id,
    slug: row.slug,
    versionLabel: row.versionLabel,
    reviewStatus: row.reviewStatus as StoredLegalVersion["reviewStatus"],
    locale: row.locale,
    title: row.title,
    summary: row.summary,
    sections: row.sections as LegalSection[],
    materialChange: row.materialChange,
    changeSummary: row.changeSummary,
    effectiveOn: row.effectiveOn ? row.effectiveOn.toISOString() : null,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    approvedByUserId: row.approvedByUserId,
    approverName: row.approverName,
  };
}

export async function getPublishedLegalVersion(
  slug: string
): Promise<StoredLegalVersion | null> {
  try {
    const [row] = await db
      .select()
      .from(legalDocumentVersions)
      .where(
        and(
          eq(legalDocumentVersions.slug, slug),
          eq(legalDocumentVersions.reviewStatus, "published")
        )
      )
      .orderBy(desc(legalDocumentVersions.publishedAt))
      .limit(1);
    return row ? mapVersion(row) : null;
  } catch {
    return null;
  }
}

export async function getReadableLegalVersion(
  slug: string,
  versionLabel: string
): Promise<StoredLegalVersion | null> {
  try {
    const [row] = await db
      .select()
      .from(legalDocumentVersions)
      .where(
        and(
          eq(legalDocumentVersions.slug, slug),
          eq(legalDocumentVersions.versionLabel, versionLabel)
        )
      )
      .limit(1);
    if (!row) return null;
    if (row.reviewStatus !== "published" && row.reviewStatus !== "archived") {
      return null;
    }
    return mapVersion(row);
  } catch {
    return null;
  }
}

export async function listLegalVersions(slug: string) {
  const rows = await db
    .select()
    .from(legalDocumentVersions)
    .where(eq(legalDocumentVersions.slug, slug))
    .orderBy(desc(legalDocumentVersions.createdAt));
  return rows.map(mapVersion);
}

export async function publishLegalDraft(input: {
  slug: string;
  versionLabel: string;
  approverName: string;
  approverUserId: string;
  confirmation: string;
  effectiveOn: string | null;
  changeSummary: string;
  actorIsSuperAdmin: boolean;
}) {
  const gate = canPublish({
    actorIsSuperAdmin: input.actorIsSuperAdmin,
    confirmation: input.confirmation,
    approverName: input.approverName,
  });
  if (!gate.ok) return gate;

  const draft = getLegalDraft(input.slug);
  if (!draft) return { ok: false as const, reason: "Unknown document." };

  const label = input.versionLabel.trim();
  if (!/^[a-z0-9][a-z0-9._-]{1,40}$/i.test(label)) {
    return { ok: false as const, reason: "Version label is not valid." };
  }

  await db
    .update(legalDocumentVersions)
    .set({ reviewStatus: "archived" })
    .where(
      and(
        eq(legalDocumentVersions.slug, draft.slug),
        eq(legalDocumentVersions.reviewStatus, "published")
      )
    );

  const [created] = await db
    .insert(legalDocumentVersions)
    .values({
      slug: draft.slug,
      versionLabel: label,
      reviewStatus: "published",
      locale: draft.locale,
      title: draft.title,
      summary: draft.summary,
      sections: draft.sections,
      materialChange: draft.materialChange,
      changeSummary: input.changeSummary.trim(),
      effectiveOn: input.effectiveOn ? new Date(input.effectiveOn) : null,
      publishedAt: new Date(),
      approvedByUserId: input.approverUserId,
      approverName: input.approverName.trim(),
    })
    .returning({ id: legalDocumentVersions.id });

  await db.insert(legalReviewEvents).values({
    slug: draft.slug,
    versionId: created?.id,
    actorUserId: input.approverUserId,
    action: "published",
    note: input.changeSummary.trim(),
  });

  return { ok: true as const, id: created?.id ?? "" };
}

export async function recordLegalAcceptance(input: {
  userId: string;
  versionId: string;
  action: "accept_terms" | "acknowledge_privacy";
  locale: string;
  source: string;
}) {
  const key = acceptanceIdempotencyKey({
    userId: input.userId,
    versionId: input.versionId,
    action: input.action,
  });
  const existing = await db
    .select({ id: legalAcceptances.id })
    .from(legalAcceptances)
    .where(eq(legalAcceptances.idempotencyKey, key))
    .limit(1);
  if (existing[0]) return { ok: true as const, duplicate: true };

  await db.insert(legalAcceptances).values({
    userId: input.userId,
    versionId: input.versionId,
    action: input.action,
    locale: input.locale.slice(0, 12),
    source: input.source.slice(0, 64),
    idempotencyKey: key,
  });
  return { ok: true as const, duplicate: false };
}

const CONSENT_PURPOSES = new Set(["marketing_email", "whatsapp"]);

export async function setConsentPreference(input: {
  userId: string;
  purpose: string;
  granted: boolean;
}) {
  if (!CONSENT_PURPOSES.has(input.purpose)) {
    return { ok: false as const, reason: "Unknown consent purpose." };
  }
  await db
    .insert(consentPreferences)
    .values({
      userId: input.userId,
      purpose: input.purpose,
      granted: input.granted,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [consentPreferences.userId, consentPreferences.purpose],
      set: { granted: input.granted, updatedAt: new Date() },
    });
  return { ok: true as const };
}

const REQUEST_TYPES = new Set([
  "access",
  "correction",
  "deletion",
  "export",
  "complaint",
  "consent_withdrawal",
]);

export async function createPrivacyRequest(input: {
  userId: string;
  requestType: string;
  details: string;
}) {
  if (!REQUEST_TYPES.has(input.requestType)) {
    return { ok: false as const, reason: "Unknown request type." };
  }
  const details = input.details.trim().slice(0, 4000);
  const [row] = await db
    .insert(privacyRequests)
    .values({
      userId: input.userId,
      requestType: input.requestType,
      details,
      status: "submitted",
    })
    .returning({ id: privacyRequests.id });
  if (row) {
    await db.insert(privacyRequestEvents).values({
      requestId: row.id,
      actorUserId: input.userId,
      status: "submitted",
      note: "Request submitted by the account holder.",
    });
  }
  return { ok: true as const, id: row?.id ?? "" };
}

export async function listOwnPrivacyRequests(userId: string) {
  return db
    .select({
      id: privacyRequests.id,
      requestType: privacyRequests.requestType,
      status: privacyRequests.status,
      createdAt: privacyRequests.createdAt,
    })
    .from(privacyRequests)
    .where(eq(privacyRequests.userId, userId))
    .orderBy(desc(privacyRequests.createdAt));
}

export async function userNeedsTermsAcceptance(userId: string): Promise<{
  required: boolean;
  versionId: string | null;
  versionLabel: string | null;
}> {
  const published = await getPublishedLegalVersion("terms");
  if (!published || !published.materialChange) {
    return { required: false, versionId: null, versionLabel: null };
  }
  const [existing] = await db
    .select({ id: legalAcceptances.id })
    .from(legalAcceptances)
    .where(
      and(
        eq(legalAcceptances.userId, userId),
        eq(legalAcceptances.versionId, published.id),
        eq(legalAcceptances.action, "accept_terms")
      )
    )
    .limit(1);
  if (existing) return { required: false, versionId: published.id, versionLabel: published.versionLabel };
  return { required: true, versionId: published.id, versionLabel: published.versionLabel };
}

export async function acceptanceCounts() {
  const rows = await db
    .select({
      versionId: legalAcceptances.versionId,
      action: legalAcceptances.action,
    })
    .from(legalAcceptances);
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = `${row.versionId}:${row.action}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}
