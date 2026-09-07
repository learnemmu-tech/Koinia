import type { PlatformRole } from "@/db/schema/enums";

export type { PlatformRole };

/** PostgreSQL `users.platform_role` is the only SuperAdmin authorization source. */
export function isPlatformSuperAdmin(
  platformRole: string | null | undefined
): boolean {
  return platformRole === "super_admin";
}

export function getSuperAdminBootstrapEmail(): string | null {
  const value = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase() ?? "";
  return value || null;
}

/**
 * One-time bootstrap only. Callers must pass the Clerk-verified primary email.
 * Never pass a client-supplied email with emailVerified=true.
 */
export function shouldBootstrapPlatformSuperAdmin(
  email: string,
  emailVerified: boolean
): boolean {
  if (!emailVerified) return false;
  const configured = getSuperAdminBootstrapEmail();
  if (!configured) return false;
  return email.trim().toLowerCase() === configured;
}
