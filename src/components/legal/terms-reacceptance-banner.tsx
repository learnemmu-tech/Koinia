import Link from "next/link";

import { LEGAL_TERMS_PATH } from "@/legal/paths";

export function TermsReacceptanceBanner({ versionLabel }: { versionLabel: string }) {
  return (
    <div className="border-b border-border bg-card px-4 py-2 text-sm">
      The Terms of Service changed in a material way ({versionLabel}). Review and accept that
      version before relying on continued use.{" "}
      <Link href={LEGAL_TERMS_PATH} className="underline">
        Read the published Terms
      </Link>
      . Existing acceptance records are unchanged.
    </div>
  );
}
