"use client";

import type { ReactNode } from "react";

import { PublicChurchProviders } from "@/components/public-church-providers";
import { SiteJsonLd } from "@/components/seo/json-ld";
import type { Locale } from "@/i18n/config";
import { I18nProvider } from "@/i18n/provider";
import type { AbstractIntlMessages } from "next-intl";

type Props = {
  initialActiveChurchId?: string | null;
  initialLocale: Locale;
  messages: AbstractIntlMessages;
  modal: ReactNode;
  children: ReactNode;
};

export function PublicRootShell({
  initialLocale,
  messages,
  modal,
  children,
}: Props) {
  return (
    <I18nProvider initialLocale={initialLocale} messages={messages}>
      <PublicChurchProviders>
        <SiteJsonLd />
        {children}
        {modal}
      </PublicChurchProviders>
    </I18nProvider>
  );
}
