import "server-only";

import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import { getOrgMembershipRow } from "@/lib/postgres/session";
import { roleMeetsMinimum, type MembershipRole } from "@/types/membership";
import { verifyBearerToken } from "@/lib/email/verify-auth";

export async function requireBillingAdmin(
  request: Request,
  requestedOrganizationId?: string
): Promise<{ clerkId: string; appUserId: string; organizationId: string }> {
  const decoded = await verifyBearerToken(request);
  if (!decoded) throw new Error("Unauthorized");

  const appUser = await getAppUserByClerkId(decoded.uid);
  if (!appUser) throw new Error("Forbidden");

  const isSuperAdmin = isPlatformSuperAdmin(appUser.platformRole);
  const organizationId = (
    requestedOrganizationId?.trim() || appUser.organizationId || ""
  ).trim();
  if (!organizationId) throw new Error("Organization not found");

  if (!isSuperAdmin) {
    if (appUser.organizationId !== organizationId) throw new Error("Forbidden");
    const membership = await getOrgMembershipRow(appUser.id, organizationId);
    if (
      membership?.status !== "active" ||
      !roleMeetsMinimum(membership.role as MembershipRole, "org_admin")
    ) {
      throw new Error("Billing admin permission required");
    }
  }

  return {
    clerkId: decoded.uid,
    appUserId: appUser.id,
    organizationId,
  };
}

export function authErrorResponse(error: unknown): {
  error: string;
  status: number;
} {
  const message = error instanceof Error ? error.message : "Request failed";
  if (message === "Unauthorized") return { error: message, status: 401 };
  if (message === "Forbidden" || message.includes("permission")) {
    return { error: message, status: 403 };
  }
  if (message === "Organization not found") return { error: message, status: 404 };
  return { error: "Unable to authorize billing action.", status: 403 };
}
