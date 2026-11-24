import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { cookieConsentEvents } from "@/db/schema";
import {
  COOKIE_CONSENT_VERSION,
  COOKIE_POLICY_VERSION,
  type ConsentAction,
  choicesForAction,
} from "@/lib/cookies/consent";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import { rateLimitCookieConsent } from "@/lib/rate-limit";

const ACTIONS = new Set<ConsentAction>([
  "accept_all",
  "reject_optional",
  "save_preferences",
  "withdraw_optional",
]);

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    anonymousId?: string;
    action?: string;
    preferences?: boolean;
    analytics?: boolean;
    externalMedia?: boolean;
    locale?: string;
    idempotencyKey?: string;
  } | null;

  if (!body || !ACTIONS.has(body.action as ConsentAction)) {
    return NextResponse.json({ error: "Invalid consent action." }, { status: 400 });
  }
  const anonymousId = body.anonymousId?.trim() ?? "";
  const idempotencyKey = body.idempotencyKey?.trim() ?? "";
  if (!/^[0-9a-f-]{16,80}$/i.test(anonymousId) || !/^[0-9a-f-]{16,80}$/i.test(idempotencyKey)) {
    return NextResponse.json({ error: "Invalid consent identifier." }, { status: 400 });
  }

  const limited = await rateLimitCookieConsent(anonymousId);
  if (!limited.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const action = body.action as ConsentAction;
  const categories = choicesForAction(action, {
    preferences: body.preferences,
    analytics: body.analytics,
    externalMedia: body.externalMedia,
  });

  const { userId } = await auth();
  const appUser = userId ? await getAppUserByClerkId(userId) : null;
  const host = new URL(request.url).host.slice(0, 200);

  const existing = await db
    .select({ id: cookieConsentEvents.id })
    .from(cookieConsentEvents)
    .where(eq(cookieConsentEvents.idempotencyKey, idempotencyKey))
    .limit(1);
  if (existing[0]) return NextResponse.json({ ok: true, duplicate: true });

  await db.insert(cookieConsentEvents).values({
    anonymousId,
    userId: appUser?.id,
    action,
    categories,
    consentVersion: COOKIE_CONSENT_VERSION,
    policyVersion: COOKIE_POLICY_VERSION,
    originHost: host,
    locale: (body.locale || "en").slice(0, 12),
    idempotencyKey,
  });

  return NextResponse.json({ ok: true, categories });
}
