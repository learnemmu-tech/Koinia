import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";
import {
  canSendPreferenceEmail,
  DEFAULT_EMAIL_PREFERENCES,
  normalizeEmailPreferences,
} from "./preferences";
import type { EmailNotificationPreferences, EmailPreferenceKey } from "./types";

export async function getUserEmailPreferences(
  userId: string
): Promise<EmailNotificationPreferences> {
  const adminDb = getAdminDb();
  if (!adminDb) {
    return { ...DEFAULT_EMAIL_PREFERENCES };
  }

  try {
    const snap = await adminDb.collection("users").doc(userId).get();
    if (!snap.exists) {
      return { ...DEFAULT_EMAIL_PREFERENCES };
    }

    const data = snap.data() as Record<string, unknown>;
    return normalizeEmailPreferences(data.emailPreferences);
  } catch (error) {
    console.error("[email] Failed to load user preferences:", error);
    return { ...DEFAULT_EMAIL_PREFERENCES };
  }
}

export async function shouldSendUserEmail(
  userId: string | undefined,
  preference: EmailPreferenceKey
): Promise<boolean> {
  if (!userId) return true;
  const preferences = await getUserEmailPreferences(userId);
  return canSendPreferenceEmail(preferences, preference);
}
