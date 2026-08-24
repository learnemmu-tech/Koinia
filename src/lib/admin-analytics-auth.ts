import { getAuth } from "firebase-admin/auth";

import {
  getManagedChurchIdForUser,
  isPlatformSuperAdmin,
  type ChurchAccessUser,
} from "@/lib/church-access";
import { getAdminApp, getAdminDb } from "@/lib/firebase-admin";
import type { ChurchRole } from "@/types/firebase-church";
import type { UserRole } from "@/lib/firebase-auth-service";

export type VerifiedAdminContext = {
  uid: string;
  email: string;
  isSuperAdmin: boolean;
  churchScope: string | null;
  organizationScope: string | null;
};

type UserProfileRecord = {
  churchId?: string;
  organizationId?: string;
  churchRole?: ChurchRole;
  managedChurchIds?: string[];
  role?: UserRole;
};

export async function verifyAdminAnalyticsRequest(
  request: Request,
  requestedChurchId?: string | null,
  requestedOrganizationId?: string | null
): Promise<
  | { ok: true; admin: VerifiedAdminContext }
  | { ok: false; status: number; error: string }
> {
  const adminApp = getAdminApp();
  const adminDb = getAdminDb();

  if (!adminApp || !adminDb) {
    return {
      ok: false,
      status: 503,
      error: "Firebase Admin is not configured on the server.",
    };
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const idToken = authHeader.slice("Bearer ".length);

  let uid: string;
  let email: string | undefined;

  try {
    const decoded = await getAuth(adminApp).verifyIdToken(idToken);
    uid = decoded.uid;
    email = decoded.email;
  } catch {
    return { ok: false, status: 401, error: "Invalid token" };
  }

  if (!email) {
    return { ok: false, status: 403, error: "Admin access required" };
  }

  const profileSnap = await adminDb.collection("users").doc(uid).get();
  const profile = (profileSnap.data() ?? {}) as UserProfileRecord;

  const accessUser: ChurchAccessUser = {
    email,
    churchId: profile.churchId,
    churchRole: profile.churchRole,
    managedChurchIds: profile.managedChurchIds,
  };

  const superAdmin =
    isPlatformSuperAdmin(email) || profile.role === "admin";

  if (!superAdmin && !getManagedChurchIdForUser(accessUser)) {
    return { ok: false, status: 403, error: "Admin access required" };
  }

  const managedChurchId = getManagedChurchIdForUser(accessUser);
  const organizationId = String(profile.organizationId ?? "").trim();
  const churchScope = superAdmin
    ? requestedChurchId?.trim() || null
    : managedChurchId;
  const organizationScope =
    requestedOrganizationId?.trim() ||
    (!churchScope && organizationId ? organizationId : null);

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
