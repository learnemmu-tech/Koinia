export const ACTIVE_BRANCH_COOKIE_NAME = "fch_active_branch";

export function readActiveBranchIdFromCookieValue(
  cookieValue?: string | null
): string | null {
  if (!cookieValue?.trim()) return null;
  try {
    return decodeURIComponent(cookieValue.trim());
  } catch {
    return cookieValue.trim();
  }
}
