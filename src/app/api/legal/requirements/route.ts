import { NextResponse } from "next/server";

import { getPublishedLegalVersion } from "@/lib/legal/repository";

export async function GET() {
  const [terms, privacy] = await Promise.all([
    getPublishedLegalVersion("terms"),
    getPublishedLegalVersion("privacy"),
  ]);
  return NextResponse.json({
    terms: terms
      ? { versionId: terms.id, versionLabel: terms.versionLabel, title: terms.title }
      : null,
    privacy: privacy
      ? { versionId: privacy.id, versionLabel: privacy.versionLabel, title: privacy.title }
      : null,
  });
}
