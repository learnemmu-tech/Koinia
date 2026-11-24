import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { LegalDocumentReader } from "@/components/legal/legal-document-reader";
import { PrivacyRequestForm } from "@/components/legal/privacy-request-form";
import { LOCALE_COOKIE, parseLocale } from "@/i18n/config";
import { LEGAL_DRAFTS, getLegalDraft } from "@/legal/documents";
import { CHURCH_ADMIN_LEGAL_NAV, MEMBER_LEGAL_NAV, legalDocumentPath } from "@/legal/paths";
import { resolveReadableDocument } from "@/legal/resolve-document";
import { resolveLegalAudience } from "@/lib/legal/audience";
import { getPublishedLegalVersion } from "@/lib/legal/repository";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const published = await getPublishedLegalVersion(slug);
  const document = resolveReadableDocument(slug, published);
  if (!document) return { title: "Legal" };
  return {
    title: document.title,
    description: document.summary,
    robots:
      document.publication === "published"
        ? { index: true, follow: true }
        : { index: false, follow: false },
    alternates:
      document.publication === "published"
        ? { canonical: legalDocumentPath(slug) }
        : undefined,
  };
}

export default async function LegalDocumentPage({ params }: Props) {
  const { slug } = await params;
  if (!getLegalDraft(slug)) notFound();
  const published = await getPublishedLegalVersion(slug);
  const document = resolveReadableDocument(slug, published);
  if (!document) notFound();

  const locale = parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  const languageNote =
    locale === "en" || document.locale === locale
      ? null
      : "The authoritative text of this document is English. A reviewed translation for the selected language is not available.";

  const audience = await resolveLegalAudience();
  const relatedSlugs = new Set<string>([
    ...MEMBER_LEGAL_NAV.map((item) => item.slug),
    ...(audience === "church_admin" ? CHURCH_ADMIN_LEGAL_NAV.map((item) => item.slug) : []),
  ]);
  const related = LEGAL_DRAFTS.filter((item) => item.slug !== slug && relatedSlugs.has(item.slug)).map(
    (item) => ({ href: legalDocumentPath(item.slug), label: item.title })
  );

  return (
    <>
      <LegalDocumentReader
        title={document.title}
        summary={document.summary}
        versionLabel={document.versionLabel}
        effectiveOn={document.effectiveOn}
        updatedOn={document.updatedOn}
        authoritativeLanguageNote={languageNote}
        sections={document.sections}
        related={related}
      />
      {slug === "privacy-rights" ? <PrivacyRequestForm /> : null}
    </>
  );
}
