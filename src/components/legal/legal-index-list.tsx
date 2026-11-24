"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { legalDocumentPath } from "@/legal/paths";
import { legalHref, safeLegalReturnTo } from "@/legal/return-to";

export function LegalIndexList({
  documents,
}: {
  documents: { slug: string; title: string; summary: string }[];
}) {
  const returnTo = safeLegalReturnTo(useSearchParams().get("returnTo"));
  return (
    <ul className="mt-8 divide-y divide-[#E4DCD0] border-y border-[#E4DCD0]">
      {documents.map((draft) => (
        <li key={draft.slug} className="py-4">
          <Link href={legalHref(legalDocumentPath(draft.slug), returnTo)} className="text-lg font-medium hover:underline">
            {draft.title}
          </Link>
          <p className="mt-1 text-sm leading-6 text-[#5C6B7A]">{draft.summary}</p>
        </li>
      ))}
    </ul>
  );
}
