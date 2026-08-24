import type { ChurchRole } from "@/types/firebase-church";

import {
  isSuperAdminEmail,
  resolveIsAdmin,
} from "./admin-access";

export type ChurchAccessUser = {
  email: string | null | undefined;
  churchId?: string | null;
  churchRole?: ChurchRole | null;
  managedChurchIds?: string[] | null;
};

/** Platform super admin — manages all churches. */
export function isPlatformSuperAdmin(
  email: string | null | undefined
): boolean {
  return resolveIsAdmin(email);
}

/** Can manage a specific church's content (super admin or church admin). */
export function canManageChurch(
  user: ChurchAccessUser,
  churchId: string
): boolean {
  if (!churchId.trim()) return false;
  if (isPlatformSuperAdmin(user.email)) return true;

  if (user.churchRole === "admin" && user.churchId === churchId) {
    return true;
  }

  return Boolean(user.managedChurchIds?.includes(churchId));
}

/** Church admin scoped to one church — cannot access other churches. */
export function isChurchAdmin(user: ChurchAccessUser): boolean {
  if (isPlatformSuperAdmin(user.email)) return false;
  return user.churchRole === "admin" && Boolean(user.churchId?.trim());
}

export function getManagedChurchIdForUser(
  user: ChurchAccessUser
): string | null {
  if (isPlatformSuperAdmin(user.email)) return null;
  if (user.churchRole === "admin" && user.churchId?.trim()) {
    return user.churchId.trim();
  }
  return user.managedChurchIds?.[0]?.trim() ?? null;
}

export { isSuperAdminEmail, resolveIsAdmin };
