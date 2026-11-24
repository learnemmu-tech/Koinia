import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import { getPublishedLegalVersion, recordLegalAcceptance, setConsentPreference } from "@/lib/legal/repository";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const appUser = await getAppUserByClerkId(userId);
  if (!appUser) return NextResponse.json({ error: "Account is not ready." }, { status: 409 });

  const body = (await request.json()) as {
    termsVersionId?: string;
    privacyVersionId?: string;
    locale?: string;
    source?: string;
    marketingEmail?: boolean;
    whatsapp?: boolean;
  };

  const terms = await getPublishedLegalVersion("terms");
  if (terms && body.termsVersionId !== terms.id) {
    return NextResponse.json({ error: "Accept the current Terms version." }, { status: 400 });
  }
  if (!terms && body.termsVersionId) {
    return NextResponse.json({ error: "No Terms version is published." }, { status: 400 });
  }

  const locale = body.locale || "en";
  const source = body.source || "sign-up";
  if (terms && body.termsVersionId) {
    await recordLegalAcceptance({
      userId: appUser.id,
      versionId: terms.id,
      action: "accept_terms",
      locale,
      source,
    });
  }

  const privacy = await getPublishedLegalVersion("privacy");
  if (privacy && body.privacyVersionId === privacy.id) {
    await recordLegalAcceptance({
      userId: appUser.id,
      versionId: privacy.id,
      action: "acknowledge_privacy",
      locale,
      source,
    });
  }

  if (body.marketingEmail) {
    await setConsentPreference({
      userId: appUser.id,
      purpose: "marketing_email",
      granted: true,
    });
  }
  if (body.whatsapp) {
    await setConsentPreference({
      userId: appUser.id,
      purpose: "whatsapp",
      granted: true,
    });
  }

  return NextResponse.json({ ok: true });
}
