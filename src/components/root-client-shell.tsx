"use client";

import type { ReactNode } from "react";
import NextTopLoader from "nextjs-toploader";

import Providers from "@/components/provider";
import { SiteJsonLd } from "@/components/seo/json-ld";
import { TailwindIndicator } from "@/components/tailwind-indicator";

type Props = {
  initialActiveChurchId: string | null;
  modal: ReactNode;
  children: ReactNode;
};

export function RootClientShell({ initialActiveChurchId, modal, children }: Props) {
  return (
    <>
      <NextTopLoader
        color="#6366f1"
        height={3}
        showSpinner={false}
        shadow="0 0 10px #6366f1"
      />

      <Providers initialChurches={[]} initialActiveChurchId={initialActiveChurchId}>
        <SiteJsonLd />
        {children}
        {modal}
      </Providers>

      <TailwindIndicator />
    </>
  );
}

