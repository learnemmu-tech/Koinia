import {
  getManagedChurchIds,
  listChurchMembershipsForUser,
  getOrgMembershipRow,
} from "@/lib/postgres/session";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import { isPlatformSuperAdmin } from "@/lib/church-access";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import { roleMeetsMinimum, type MembershipRole } from "@/types/membership";

export type VerifiedAdminContext = {
  uid: string;
  email: string;
  isSuperAdmin: boolean;
  churchScope: string | null;
  organizationScope: string | null;
};

export async function verifyAdminAnalyticsRequest(
  request: Request,
  requestedChurchId?: string | null,
  requestedOrganizationId?: string | null
): Promise<
  | { ok: true; admin: VerifiedAdminContext }
  | { ok: false; status: number; error: string }
> {
  const verified = await verifyBearerToken(request);
  if (!verified) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const uid = verified.uid;
  const email = verified.email;

  if (!email) {
    return { ok: false, status: 403, error: "Admin access required" };
  }

  const appUser = await getAppUserByClerkId(uid);
  if (!appUser) {
    return { ok: false, status: 403, error: "Admin access required" };
  }

  const superAdmin =
    isPlatformSuperAdmin(email) || appUser.platformRole === "admin";

  const churchRows = await listChurchMembershipsForUser(appUser.id);
  const managedFromMemberships = churchRows
    .filter(
      (row) =>
        row.status === "active" &&
        roleMeetsMinimum(row.role as MembershipRole, "church_admin")
    )
    .map((row) => row.churchId);

  const managedFromOrg = appUser.organizationId
    ? await getManagedChurchIds(appUser.id, appUser.organizationId)
    : [];

  const managedChurchIds = [
    ...new Set([...managedFromMemberships, ...managedFromOrg]),
  ];
  const managedChurchId = managedChurchIds[0] ?? null;

  const orgRow = appUser.organizationId
    ? await getOrgMembershipRow(appUser.id, appUser.organizationId)
    : null;
  const organizationId =
    orgRow?.status === "active" ? appUser.organizationId : null;

  if (!superAdmin && !managedChurchId && !organizationId) {
    return { ok: false, status: 403, error: "Admin access required" };
  }

  const requestedChurch = requestedChurchId?.trim() || null;
  const requestedOrg = requestedOrganizationId?.trim() || null;

  let churchScope: string | null = null;
  let organizationScope: string | null = null;

  if (superAdmin) {
    churchScope = requestedChurch;
    organizationScope = requestedOrg || (!churchScope ? organizationId : null);
  } else {
    if (requestedChurch) {
      if (!managedChurchIds.includes(requestedChurch)) {
        return { ok: false, status: 403, error: "Forbidden" };
      }
      churchScope = requestedChurch;
    } else {
      churchScope = managedChurchId;
    }

    if (requestedOrg) {
      if (!organizationId || requestedOrg !== organizationId) {
        return { ok: false, status: 403, error: "Forbidden" };
      }
      organizationScope = requestedOrg;
    } else if (!churchScope && organizationId) {
      organizationScope = organizationId;
    }
  }

  if (!superAdmin && !churchScope && !organizationScope) {
    return {
      ok: false,
      status: 403,
      error: "No church scope available for this admin account.",
    };
  }

  return {
    ok: true,
    admin: {
      uid,
      email,
      isSuperAdmin: superAdmin,
      churchScope,
      organizationScope,
    },
  };
}
