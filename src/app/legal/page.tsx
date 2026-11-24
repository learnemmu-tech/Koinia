import type { Metadata } from "next";
import { Suspense } from "react";

import { LegalIndexList } from "@/components/legal/legal-index-list";
import { LEGAL_DRAFTS } from "@/legal/documents";
import { CHURCH_ADMIN_LEGAL_NAV, MEMBER_LEGAL_NAV } from "@/legal/paths";
import { resolveLegalAudience } from "@/lib/legal/audience";

export const metadata: Metadata = {
  title: "Legal Center",
  description: "Koinia Terms of Service, Privacy Policy, and related documents.",
};

export default async function LegalCenterPage() {
  const audience = await resolveLegalAudience();
  const slugs = new Set<string>([
    ...MEMBER_LEGAL_NAV.map((item) => item.slug),
    ...(audience === "church_admin" ? CHURCH_ADMIN_LEGAL_NAV.map((item) => item.slug) : []),
  ]);
  const documents = LEGAL_DRAFTS.filter((draft) => slugs.has(draft.slug));

  return (
    <div className="mx-auto max-w-[760px]">
      <h1 className="font-heading text-4xl font-semibold tracking-tight">Legal Center</h1>
      <p className="mt-4 text-lg leading-8 text-[#3E4C59]">
        These are Koinia’s platform documents. Each one is a separate text. Church sites use the
        same documents and return you to the page you came from.
      </p>
      <Suspense fallback={null}>
        <LegalIndexList
          documents={documents.map((draft) => ({
            slug: draft.slug,
            title: draft.title,
            summary: draft.summary,
          }))}
        />
      </Suspense>
    </div>
  );
}
