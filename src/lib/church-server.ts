import { cookies } from "next/headers";

import type { NextResponse } from "next/server";

import type { FirebaseChurch } from "@/types/firebase-church";

import {
  ACTIVE_CHURCH_COOKIE_NAME,
  persistActiveChurchCookieOptions,
  readActiveChurchIdFromCookieValue,
} from "./church-cookies";
import {
  ACTIVE_BRANCH_COOKIE_NAME,
  readActiveBranchIdFromCookieValue,
} from "./branch-cookies";
import { resolveCurrentMemberChurchContext } from "@/lib/organization/resolve-current-church-server";

export async function getActiveChurchIdFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return readActiveChurchIdFromCookieValue(
    cookieStore.get(ACTIVE_CHURCH_COOKIE_NAME)?.value
  );
}

export async function getActiveBranchIdFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return readActiveBranchIdFromCookieValue(
    cookieStore.get(ACTIVE_BRANCH_COOKIE_NAME)?.value
  );
}

/**
 * Current church for the authenticated member. Never falls back to the first
 * church in the database or a global default tenant.
 */
export async function resolveActiveChurchId(): Promise<string> {
  const { scope } = await resolveCurrentMemberChurchContext();
  return scope.churchId || "";
}

export async function resolveActiveChurch(): Promise<FirebaseChurch | null> {
  const { church } = await resolveCurrentMemberChurchContext();
  return church;
}

export function setActiveChurchCookieOnResponse<T>(
  response: NextResponse<T>,
  churchId: string
): NextResponse<T> {
  const id = churchId.trim();
  if (!id) return response;
  response.cookies.set(
    ACTIVE_CHURCH_COOKIE_NAME,
    id,
    persistActiveChurchCookieOptions()
  );
  return response;
}
