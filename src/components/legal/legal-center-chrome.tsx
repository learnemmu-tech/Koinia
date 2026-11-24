"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import {
  CHURCH_ADMIN_LEGAL_NAV,
  LEGAL_CENTER_PATH,
  MEMBER_LEGAL_NAV,
  legalDocumentPath,
} from "@/legal/paths";
import { legalHref, legalReturnLabel, safeLegalReturnTo } from "@/legal/return-to";
import type { LegalAudience } from "@/lib/legal/audience-types";

export function LegalCenterChrome({
  audience,
  children,
}: {
  audience: LegalAudience;
  children: React.ReactNode;
}) {
  const params = useSearchParams();
  const returnTo = safeLegalReturnTo(params.get("returnTo"));
  const backLabel = legalReturnLabel(returnTo);
  const links = [
    { href: LEGAL_CENTER_PATH, label: "Legal Center" },
    ...MEMBER_LEGAL_NAV.map((item) => ({
      href: legalDocumentPath(item.slug),
      label: item.label,
    })),
    ...(audience === "church_admin"
      ? CHURCH_ADMIN_LEGAL_NAV.map((item) => ({
          href: legalDocumentPath(item.slug),
          label: item.label,
        }))
      : []),
  ];

  return (
    <div className="legal-center min-h-svh bg-[#F7F4EF] text-[#1C2B3A]">
      <header className="sticky top-0 z-30 border-b border-[#E4DCD0] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 sm:px-6">
          <Link href={legalHref(LEGAL_CENTER_PATH, returnTo)} className="text-sm font-semibold tracking-tight">
            Koinia
          </Link>
          <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#4E5D6C]">
            {links.map((link) => (
              <Link key={link.href} href={legalHref(link.href, returnTo)} className="hover:text-[#1C2B3A]">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <LocaleSwitcher />
            {backLabel && returnTo ? (
              <Link href={returnTo} className="text-sm font-medium text-[#1C2B3A] underline-offset-4 hover:underline">
                {backLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 sm:py-10">{children}</div>
      <footer className="border-t border-[#E4DCD0] bg-white">
        <nav aria-label="Legal documents" className="mx-auto flex max-w-[1180px] flex-wrap gap-x-5 gap-y-2 px-4 py-6 text-sm text-[#4E5D6C] sm:px-6">
          {MEMBER_LEGAL_NAV.map((item) => (
            <Link key={item.slug} href={legalHref(legalDocumentPath(item.slug), returnTo)} className="hover:text-[#1C2B3A]">
              {item.label}
            </Link>
          ))}
        </nav>
      </footer>
    </div>
  );
}
