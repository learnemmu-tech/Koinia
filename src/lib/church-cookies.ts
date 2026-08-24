export const ACTIVE_CHURCH_COOKIE_NAME = "fch_active_church_id";

export function readActiveChurchIdFromCookieValue(
  value: string | undefined | null
): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
