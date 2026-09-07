import type { ChurchRole } from "@/types/firebase-church";

import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";

export type ChurchAccessUser = {
  email: string | null | undefined;
  platformRole?: string | null;
  churchId?: string | null;
  churchRole?: ChurchRole | null;
  managedChurchIds?: string[] | null;
};

export { isPlatformSuperAdmin };

/** Can manage a specific church's content (platform SuperAdmin or church admin). */
export function canManageChurch(
  user: ChurchAccessUser,
  churchId: string
): boolean {
  if (!churchId.trim()) return false;
  if (isPlatformSuperAdmin(user.platformRole)) return true;

  if (user.churchRole === "admin" && user.churchId === churchId) {
    return true;
  }

  return Boolean(user.managedChurchIds?.includes(churchId));
}

/** Church admin scoped to one church — cannot access other churches. */
export function isChurchAdmin(user: ChurchAccessUser): boolean {
  if (isPlatformSuperAdmin(user.platformRole)) return false;
  return user.churchRole === "admin" && Boolean(user.churchId?.trim());
}

export function getManagedChurchIdForUser(
  user: ChurchAccessUser
): string | null {
  if (isPlatformSuperAdmin(user.platformRole)) return null;
  if (user.churchRole === "admin" && user.churchId?.trim()) {
    return user.churchId.trim();
  }
  return user.managedChurchIds?.[0]?.trim() ?? null;
}
