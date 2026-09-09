"use client";

import type { ReactNode } from "react";
import NextTopLoader from "nextjs-toploader";

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
    <>
      <NextTopLoader
        color="#6366f1"
        height={3}
        showSpinner={false}
        shadow="0 0 10px #6366f1"
      />

      <I18nProvider initialLocale={initialLocale}>
        <Providers initialChurches={[]} initialActiveChurchId={initialActiveChurchId}>
          <SiteJsonLd />
          {children}
          {modal}
        </Providers>
      </I18nProvider>
    </>
  );
}

