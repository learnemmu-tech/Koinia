import { cookies } from "next/headers";

import type { FirebaseChurch } from "@/types/firebase-church";

import {
  ACTIVE_CHURCH_COOKIE_NAME,
  readActiveChurchIdFromCookieValue,
} from "./church-cookies";
import {
  ACTIVE_BRANCH_COOKIE_NAME,
  readActiveBranchIdFromCookieValue,
} from "./branch-cookies";
import { getLegacyDefaultChurchId } from "./church-scope";
import { getActiveChurches, getChurchById } from "./church-queries";

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

export async function resolveActiveChurchId(): Promise<string> {
  const fromCookie = await getActiveChurchIdFromCookies();
  if (fromCookie) {
    try {
      const church = await getChurchById(fromCookie);
      if (church?.isActive) return church.id;
    } catch {
      // Stale cookie or inactive church — fall through to defaults.
    }
  }

  try {
    const activeChurches = await getActiveChurches();
    if (activeChurches[0]) return activeChurches[0].id;
  } catch {
    // Fall through to legacy default when Firestore is unavailable.
  }

  const legacyId = getLegacyDefaultChurchId();
  if (legacyId) return legacyId;

  return "";
}

export async function resolveActiveChurch(): Promise<FirebaseChurch | null> {
  try {
    const churchId = await resolveActiveChurchId();
    if (!churchId) return null;
    return getChurchById(churchId);
  } catch {
    return null;
  }
}
