import type { EmailNotificationPreferences, EmailPreferenceKey } from "./types";

export const DEFAULT_EMAIL_PREFERENCES: EmailNotificationPreferences = {
  song: true,
  sermon: true,
  article: true,
  event: true,
  donation: true,
  prayer: true,
};

export function normalizeEmailPreferences(
  value: unknown
): EmailNotificationPreferences {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_EMAIL_PREFERENCES };
  }

  const record = value as Record<string, unknown>;

  // Legacy keys: `announcement` enabled all content publish emails.
  const legacyAnnouncement =
    record.announcement !== false && record.announcement !== undefined;

  function resolveContentPref(
    key: "song" | "sermon" | "article"
  ): boolean {
    if (record[key] === true) return true;
    if (record[key] === false) return false;
    if (legacyAnnouncement) return true;
    return true;
  }

  return {
    song: resolveContentPref("song"),
    sermon: resolveContentPref("sermon"),
    article: resolveContentPref("article"),
    event: record.event !== false,
    donation: record.donation !== false,
    prayer: record.prayer !== false,
  };
}

export function canSendPreferenceEmail(
  preferences: EmailNotificationPreferences,
  key: EmailPreferenceKey
): boolean {
  return preferences[key] === true;
}
