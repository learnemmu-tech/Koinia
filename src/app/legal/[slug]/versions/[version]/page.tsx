import { notFound } from "next/navigation";

import { LegalDocumentReader } from "@/components/legal/legal-document-reader";
import { getLegalDraft } from "@/legal/documents";
import { getReadableLegalVersion } from "@/lib/legal/repository";

type Props = { params: Promise<{ slug: string; version: string }> };

export default async function HistoricalLegalPage({ params }: Props) {
  const { slug, version } = await params;
  if (!getLegalDraft(slug)) notFound();
  const stored = await getReadableLegalVersion(slug, decodeURIComponent(version));
  if (!stored) notFound();
  return (
    <LegalDocumentReader
      title={stored.title}
      summary={stored.summary}
      versionLabel={stored.versionLabel}
      effectiveOn={stored.effectiveOn?.slice(0, 10) ?? null}
      updatedOn={stored.publishedAt?.slice(0, 10) ?? null}
      authoritativeLanguageNote="The authoritative language of the stored version is the language recorded on that version."
      sections={stored.sections}
      related={[]}
    />
  );
}
