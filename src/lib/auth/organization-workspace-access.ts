import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";

/** Organization platform access is `organizations.status`, not subscription status. */
export function isOrganizationAccessSuspended(
  status: string | null | undefined
): boolean {
  return status === "suspended";
}

export function canAccessOrganizationWorkspace({
  platformRole,
  organizationStatus,
}: {
  platformRole?: string | null;
  organizationStatus?: string | null;
}): boolean {
  if (isPlatformSuperAdmin(platformRole)) return true;
  return !isOrganizationAccessSuspended(organizationStatus);
}
