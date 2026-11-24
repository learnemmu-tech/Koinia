import { getLegalDraft } from "./documents";
import type { LegalSection, StoredLegalVersion } from "./types";

export type ReadableLegalDocument = {
  slug: string;
  title: string;
  summary: string;
  sections: LegalSection[];
  versionLabel: string;
  /** Present only when a published database version supplies it. */
  effectiveOn: string | null;
  updatedOn: string | null;
  /** Published means a stored published snapshot. Current text is the authored document. */
  publication: "published" | "current_text";
  locale: string;
};

const AUTHORED_ON = "2026-11-22";

export function resolveReadableDocument(
  slug: string,
  published: StoredLegalVersion | null
): ReadableLegalDocument | null {
  if (published && published.slug === slug && published.reviewStatus === "published") {
    return {
      slug,
      title: published.title,
      summary: published.summary,
      sections: published.sections,
      versionLabel: published.versionLabel,
      effectiveOn: published.effectiveOn?.slice(0, 10) ?? null,
      updatedOn: published.publishedAt?.slice(0, 10) ?? null,
      publication: "published",
      locale: published.locale,
    };
  }
  const draft = getLegalDraft(slug);
  if (!draft || draft.slug !== slug) return null;
  return {
    slug,
    title: draft.title,
    summary: draft.summary,
    sections: draft.sections,
    versionLabel: draft.draftId,
    effectiveOn: null,
    updatedOn: AUTHORED_ON,
    publication: "current_text",
    locale: draft.locale,
  };
}
