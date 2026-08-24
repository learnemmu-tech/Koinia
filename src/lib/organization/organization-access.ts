import type { FirebaseMembership, MembershipRole } from "@/types/membership";

import { isPlatformSuperAdmin } from "@/lib/church-access";
import { roleMeetsMinimum } from "@/types/membership";

export type OrganizationAccessUser = {
  email: string | null | undefined;
  userId?: string | null;
  membership?: FirebaseMembership | null;
  /** Legacy church fields — used when membership doc is absent */
  churchId?: string | null;
  churchRole?: "member" | "admin" | null;
  managedChurchIds?: string[] | null;
};

export function resolveEffectiveRole(
  user: OrganizationAccessUser
): MembershipRole | null {
  if (user.membership?.status === "active") {
    return user.membership.role;
  }
  return null;
}

export function canManageOrganization(
  user: OrganizationAccessUser,
  organizationId: string
): boolean {
  if (!organizationId.trim()) return false;
  if (isPlatformSuperAdmin(user.email)) return true;

  const membership = user.membership;
  if (!membership || membership.organizationId !== organizationId) {
    return false;
  }
  if (membership.status !== "active") return false;

  return roleMeetsMinimum(membership.role, "org_admin");
}

export function canManageChurchInOrganization(
  user: OrganizationAccessUser,
  organizationId: string,
  churchId: string
): boolean {
  if (!organizationId.trim() || !churchId.trim()) return false;
  if (isPlatformSuperAdmin(user.email)) return true;

  const membership = user.membership;
  if (membership?.organizationId === organizationId && membership.status === "active") {
    if (roleMeetsMinimum(membership.role, "org_admin")) return true;
    if (membership.role === "owner") return true;
  }

  // Legacy fallback
  if (user.churchRole === "admin" && user.churchId === churchId) return true;
  return Boolean(user.managedChurchIds?.includes(churchId));
}

export function canEditContentInChurch(
  user: OrganizationAccessUser,
  organizationId: string,
  churchId: string
): boolean {
  if (canManageChurchInOrganization(user, organizationId, churchId)) return true;

  const membership = user.membership;
  if (
    membership?.organizationId === organizationId &&
    membership.status === "active" &&
    roleMeetsMinimum(membership.role, "org_admin")
  ) {
    return true;
  }

  return false;
}

export function isOrganizationOwner(
  user: OrganizationAccessUser,
  organizationId: string
): boolean {
  if (isPlatformSuperAdmin(user.email)) return true;
  return (
    user.membership?.organizationId === organizationId &&
    user.membership.role === "owner" &&
    user.membership.status === "active"
  );
}
