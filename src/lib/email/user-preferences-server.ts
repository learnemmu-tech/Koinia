import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import {
  canSendPreferenceEmail,
  DEFAULT_EMAIL_PREFERENCES,
  normalizeEmailPreferences,
} from "./preferences";
import type { EmailNotificationPreferences, EmailPreferenceKey } from "./types";

export async function getUserEmailPreferences(
  userId: string
): Promise<EmailNotificationPreferences> {
  try {
    const appUser = await getAppUserByClerkId(userId);
    if (!appUser) return { ...DEFAULT_EMAIL_PREFERENCES };
    return normalizeEmailPreferences(appUser.emailPreferences);
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

export async function saveUserEmailPreferences(
  clerkId: string,
  preferences: EmailNotificationPreferences
): Promise<void> {
  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser) throw new Error("User not found.");
  await db
    .update(users)
    .set({ emailPreferences: preferences, updatedAt: new Date() })
    .where(eq(users.id, appUser.id));
}
