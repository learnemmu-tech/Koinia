import { NextResponse } from "next/server";

import { resolveIsAdmin } from "@/lib/admin-access";
import { canManageChurch } from "@/lib/church-access";
import { getAdminDb } from "@/lib/firebase-admin";
import { resolveChurchIdForWrite } from "@/lib/church-scope";
import { getOrganizationsForUser } from "@/lib/organization/organization-server";
import { resolveTenantScopeForChurch } from "@/lib/organization/resolve-tenant-scope";
import {
  ensureSubscriptionDocument,
  getSubscriptionSnapshot,
  getSubscriptionSnapshotForChurch,
} from "@/lib/subscription/subscription-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizationIdParam = searchParams.get("organizationId")?.trim();
  const churchIdParam = resolveChurchIdForWrite(searchParams.get("churchId"));

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ?
    authHeader.slice(7)
  : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminDb = getAdminDb();

  try {
    const { getAuth } = await import("firebase-admin/auth");
    const decoded = await getAuth().verifyIdToken(token);

    let organizationId = organizationIdParam;

    if (!organizationId && adminDb) {
      const userSnap = await adminDb.collection("users").doc(decoded.uid).get();
      const userData = userSnap.exists ? userSnap.data() : null;
      organizationId = String(userData?.organizationId ?? "").trim();

      if (!organizationId) {
        const orgs = await getOrganizationsForUser(decoded.uid);
        organizationId = orgs[0]?.id;
      }
    }

    if (!organizationId && churchIdParam) {
      const scope = await resolveTenantScopeForChurch(churchIdParam);
      organizationId = scope.organizationId || churchIdParam;
    }

    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    if (adminDb) {
      const userSnap = await adminDb.collection("users").doc(decoded.uid).get();
      const userData = userSnap.exists ? userSnap.data() : null;

      const isAdmin =
        resolveIsAdmin(decoded.email) || userData?.role === "admin";
      const canManage = canManageChurch(
        {
          email: decoded.email,
          churchId: userData?.churchId as string | undefined,
          churchRole: userData?.churchRole as "member" | "admin" | undefined,
          managedChurchIds: userData?.managedChurchIds as string[] | undefined,
        },
        churchIdParam
      );
      const isMemberOfOrg =
        String(userData?.organizationId ?? "").trim() === organizationId;

      if (!isAdmin && !canManage && !isMemberOfOrg) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    await ensureSubscriptionDocument(organizationId);
    const snapshot = churchIdParam && !organizationIdParam
      ? await getSubscriptionSnapshotForChurch(churchIdParam)
      : await getSubscriptionSnapshot(organizationId);

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("[api/subscription]", error);
    return NextResponse.json(
      { error: "Failed to load subscription" },
      { status: 500 }
    );
  }
}
