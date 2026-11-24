import { notFound } from "next/navigation";

import { LegalDocumentReader } from "@/components/legal/legal-document-reader";
import { requirePlatformSuperAdmin } from "@/lib/auth/require-platform-super-admin";
import { getLegalDraft } from "@/legal/documents";
import { listLegalVersions } from "@/lib/legal/repository";

type Props = { params: Promise<{ slug: string }> };

export default async function SuperAdminLegalPreview({ params }: Props) {
  await requirePlatformSuperAdmin();
  const { slug } = await params;
  const draft = getLegalDraft(slug);
  if (!draft) notFound();
  const versions = await listLegalVersions(slug).catch(() => []);
  const previous = versions[1];
  const current = versions[0];
  const changed =
    previous && current
      ? current.sections
          .filter((section) => {
            const prior = previous.sections.find((item) => item.id === section.id);
            return JSON.stringify(prior?.blocks) !== JSON.stringify(section.blocks);
          })
          .map((section) => section.title)
      : [];

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        Draft preview for super admins. Status: {draft.reviewStatus}. This preview is not the public page.
      </p>
      {changed.length > 0 ? (
        <p className="mb-4 text-sm">Sections that differ from the previous stored version: {changed.join(", ")}.</p>
      ) : null}
      <LegalDocumentReader
        title={draft.title}
        summary={draft.summary}
        versionLabel={draft.draftId}
        effectiveOn={null}
        updatedOn={null}
        authoritativeLanguageNote="Super admin preview of the authored text."
        sections={draft.sections}
        related={[]}
      />
    </div>
  );
}
