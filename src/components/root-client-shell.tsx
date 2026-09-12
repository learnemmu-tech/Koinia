"use client";

import type { ReactNode } from "react";

import Providers from "@/components/provider";
import { SiteJsonLd } from "@/components/seo/json-ld";
import type { Locale } from "@/i18n/config";
import { I18nProvider } from "@/i18n/provider";

type Props = {
  initialActiveChurchId: string | null;
  initialLocale: Locale;
  modal: ReactNode;
  children: ReactNode;
};

export function RootClientShell({
  initialActiveChurchId,
  initialLocale,
  modal,
  children,
}: Props) {
  return (
    <I18nProvider initialLocale={initialLocale}>
      <Providers initialChurches={[]} initialActiveChurchId={initialActiveChurchId}>
        <SiteJsonLd />
        {children}
        {modal}
      </Providers>
    </I18nProvider>
  );
}
