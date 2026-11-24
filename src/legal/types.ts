/** Review lifecycle. Generated text must never start as approved or published. */
export type LegalReviewStatus =
  | "draft"
  | "pending_legal_review"
  | "approved"
  | "published"
  | "archived";

export type LegalAudience =
  | "all_users"
  | "church_customers"
  | "administrators"
  | "donors"
  | "public";

export type LegalDocumentKind =
  | "public_policy"
  | "contract"
  | "appendix"
  | "disclosure"
  | "procedure";

export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "note"; text: string };

export type LegalSection = {
  id: string;
  title: string;
  blocks: LegalBlock[];
};

export type LegalDocumentDraft = {
  slug: string;
  title: string;
  summary: string;
  audience: LegalAudience;
  kind: LegalDocumentKind;
  /** Code draft identifier. Not an effective-date version. */
  draftId: string;
  reviewStatus: "draft" | "pending_legal_review";
  /** English is the only authored language in this draft. */
  locale: "en";
  materialChange: boolean;
  sections: LegalSection[];
};

export type StoredLegalVersion = {
  id: string;
  slug: string;
  versionLabel: string;
  reviewStatus: LegalReviewStatus;
  locale: string;
  title: string;
  summary: string;
  sections: LegalSection[];
  materialChange: boolean;
  changeSummary: string;
  effectiveOn: string | null;
  publishedAt: string | null;
  approvedByUserId: string | null;
  approverName: string | null;
};
