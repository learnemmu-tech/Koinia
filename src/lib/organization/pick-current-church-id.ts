/**
 * Deterministic current-church selection. Never uses "first church" when
 * more than one accessible church exists.
 *
 * Priority:
 * 1. Profile / users.activeChurchId (database pointer)
 * 2. Cookie, only if it is one of the caller's accessible churches
 * 3. The sole accessible church
 */
export function pickCurrentChurchId(input: {
  profileChurchId?: string | null;
  cookieChurchId?: string | null;
  accessibleChurchIds?: readonly string[] | null;
}): string {
  const profileChurchId = input.profileChurchId?.trim() || "";
  if (profileChurchId) return profileChurchId;

  const accessible = [
    ...new Set(
      (input.accessibleChurchIds ?? []).map((id) => id.trim()).filter(Boolean)
    ),
  ];

  const cookieChurchId = input.cookieChurchId?.trim() || "";
  if (cookieChurchId && accessible.includes(cookieChurchId)) {
    return cookieChurchId;
  }

  if (accessible.length === 1) {
    return accessible[0]!;
  }

  return "";
}
