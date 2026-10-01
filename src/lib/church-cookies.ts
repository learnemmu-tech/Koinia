export const ACTIVE_CHURCH_COOKIE_NAME = "fch_active_church_id";

const ACTIVE_CHURCH_COOKIE_MAX_AGE = 31536000;

export function readActiveChurchIdFromCookieValue(
  value: string | undefined | null
): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function persistActiveChurchCookieOptions() {
  return {
    path: "/",
    maxAge: ACTIVE_CHURCH_COOKIE_MAX_AGE,
    sameSite: "lax" as const,
  };
}

/** Client hint only — server membership / users.activeChurchId is authoritative. */
export function persistActiveChurchCookie(churchId: string) {
  if (typeof document === "undefined") return;
  const id = churchId.trim();
  if (!id) return;
  document.cookie = `${ACTIVE_CHURCH_COOKIE_NAME}=${encodeURIComponent(id)}; path=/; max-age=${ACTIVE_CHURCH_COOKIE_MAX_AGE}; samesite=lax`;
}
