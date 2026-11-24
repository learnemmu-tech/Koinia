import type { Metadata } from "next";
import { Suspense } from "react";

import { LegalCenterChrome } from "@/components/legal/legal-center-chrome";
import { resolveLegalAudience } from "@/lib/legal/audience";

export const metadata: Metadata = {
  title: { default: "Legal Center", template: "%s · Koinia" },
};

export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const audience = await resolveLegalAudience();
  return (
    <div id="top">
      <Suspense fallback={null}>
        <LegalCenterChrome audience={audience}>{children}</LegalCenterChrome>
      </Suspense>
    </div>
  );
}
