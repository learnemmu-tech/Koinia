"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { LEGAL_PRIVACY_PATH, LEGAL_TERMS_PATH } from "@/legal/paths";
import { legalHref } from "@/legal/return-to";

export function AuthLegalLinks({
  terms,
  privacy,
  className,
}: {
  terms: string;
  privacy: string;
  className?: string;
}) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const returnTo = search ? `${pathname}?${search}` : pathname;

  return (
    <nav className={className} aria-label={terms}>
      <Link href={legalHref(LEGAL_TERMS_PATH, returnTo)}>{terms}</Link>
      <span aria-hidden>·</span>
      <Link href={legalHref(LEGAL_PRIVACY_PATH, returnTo)}>{privacy}</Link>
    </nav>
  );
}
