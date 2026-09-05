import { NextResponse } from "next/server";

import { resolveIsAdmin } from "@/lib/admin-access";
import { getOrganizationsForUser } from "@/lib/organization/organization-server";
import { resolveTenantScopeForChurch } from "@/lib/organization/resolve-tenant-scope";
import {
  getAppUserByClerkId,
} from "@/lib/postgres/app-user";
import { postgresUuidOrEmpty } from "@/lib/postgres/uuid";
import {
  getOrgMembershipRow,
  listChurchMembershipsForUser,
  userCanAccessChurchContent,
} from "@/lib/postgres/session";
import {
  ensureSubscriptionDocument,
  getSubscriptionSnapshot,
  getSubscriptionSnapshotForChurch,
} from "@/lib/subscription/subscription-server";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import { timed } from "@/lib/perf";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizationIdParam = searchParams.get("organizationId")?.trim();
  const churchIdParam = postgresUuidOrEmpty(searchParams.get("churchId"));

  const decoded = await verifyBearerToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const appUser = await getAppUserByClerkId(decoded.uid);
    if (!appUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let organizationId = organizationIdParam;

    if (!organizationId) {
      organizationId = appUser.organizationId ?? "";
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

    const isAdmin =
      resolveIsAdmin(decoded.email) || appUser.platformRole === "admin";

    if (!isAdmin) {
      if (churchIdParam) {
        const canAccess = await userCanAccessChurchContent(
          decoded.uid,
          decoded.email,
          churchIdParam
        );
        if (!canAccess) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      } else {
        const orgRow = await getOrgMembershipRow(appUser.id, organizationId);
        const churchRows = await listChurchMembershipsForUser(appUser.id);
        const isMemberOfOrg =
          orgRow?.status === "active" ||
          appUser.organizationId === organizationId ||
          churchRows.some(
            (row) =>
              row.organizationId === organizationId && row.status === "active"
          );
        if (!isMemberOfOrg) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
    }

    await timed("subscription.ensure", () =>
      ensureSubscriptionDocument(organizationId)
    );
    const snapshot = await timed("subscription.snapshot", () =>
      churchIdParam && !organizationIdParam
        ? getSubscriptionSnapshotForChurch(churchIdParam)
        : getSubscriptionSnapshot(organizationId)
    );

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("[api/subscription]", error);
    return NextResponse.json(
      { error: "Failed to load subscription" },
      { status: 500 }
    );
  }
}
