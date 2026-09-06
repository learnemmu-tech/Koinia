import "server-only";

import type { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { joinPathForSlug } from "@/lib/auth/auth-paths";
import { getChurchByJoinSlug } from "@/lib/organization/join-server";
import { env } from "@/lib/env";

export const JOIN_INTENT_COOKIE_NAME = "fc_join_slug";

/** Short-lived routing hint — not authoritative; slug is validated against PostgreSQL before use. */
const JOIN_INTENT_MAX_AGE_SECONDS = 45 * 60;

const JOIN_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizeJoinSlug(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase() ?? "";
  if (!normalized || !JOIN_SLUG_PATTERN.test(normalized)) {
    return null;
  }
  return normalized;
}

function joinIntentCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/** Route handlers and Server Actions only — not Server Components. */
export function setJoinIntentCookieOnResponse(
  response: NextResponse,
  slug: string
): NextResponse {
  const normalized = normalizeJoinSlug(slug);
  if (!normalized) return response;

  response.cookies.set(
    JOIN_INTENT_COOKIE_NAME,
    normalized,
    joinIntentCookieOptions(JOIN_INTENT_MAX_AGE_SECONDS)
  );
  return response;
}

/** Route handlers and Server Actions only — not Server Components. */
export async function clearJoinIntentCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(JOIN_INTENT_COOKIE_NAME, "", joinIntentCookieOptions(0));
}

export function clearJoinIntentCookieOnResponse(
  response: NextResponse
): NextResponse {
  response.cookies.set(JOIN_INTENT_COOKIE_NAME, "", joinIntentCookieOptions(0));
  return response;
}

export async function readJoinIntentSlugFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return normalizeJoinSlug(cookieStore.get(JOIN_INTENT_COOKIE_NAME)?.value);
}

/**
 * Returns `/join/{slug}` when the join-intent cookie contains a slug that maps
 * to an active join link in PostgreSQL.
 */
export async function getValidatedJoinIntentPath(): Promise<string | null> {
  const slug = await readJoinIntentSlugFromCookies();
  if (!slug) return null;

  const church = await getChurchByJoinSlug(slug);
  if (!church || church.slugStatus !== "active") {
    return null;
  }

  return joinPathForSlug(church.slug);
}
