import { NextResponse } from "next/server";

import { roleMeetsMinimum } from "@/types/membership";
import { isOrganizationAccessSuspended } from "@/lib/auth/organization-workspace-access";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";
import {
  ensureOrganizationForUser,
  getOrganizationSnapshot,
  getOrganizationsForUser,
} from "@/lib/organization/organization-server";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import { triggerOrganizationCreatedAdminEmail } from "@/lib/email/triggers";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import { timed } from "@/lib/perf";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId")?.trim();

  const decoded = await verifyBearerToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = decoded.uid;
    const appUser = await getAppUserByClerkId(userId);
    const isSuperAdmin = isPlatformSuperAdmin(appUser?.platformRole);

    let targetOrgId = organizationId;
    if (!targetOrgId) {
      // Prefer profile org — avoids list-orgs waterfall when already known.
      targetOrgId = appUser?.organizationId?.trim() || undefined;
      if (!targetOrgId) {
        const orgs = await timed("organization.list-for-user", () =>
          getOrganizationsForUser(userId)
        );
        if (orgs[0]) {
          targetOrgId = orgs[0].id;
        }
      }
    }

    if (!targetOrgId) {
      return NextResponse.json({
        organization: null,
        membership: null,
        branchMembership: null,
        branchMemberships: [],
        churches: [],
        branchesByChurch: {},
      });
    }

    const snapshot = await timed("organization.snapshot", () =>
      getOrganizationSnapshot(targetOrgId, userId)
    );
    if (!snapshot) {
      return NextResponse.json({
        organization: null,
        membership: null,
        branchMembership: null,
        branchMemberships: [],
        churches: [],
        branchesByChurch: {},
      });
    }

    const hasActiveOrgMembership = snapshot.membership?.status === "active";
    const hasActiveBranchMembership = snapshot.branchMemberships.some(
      (m) => m.status === "active"
    );
    const hasPendingBranchMembership = snapshot.branchMemberships.some(
      (m) => m.status === "pending"
    );
    const hasAdminBranchRole = snapshot.branchMemberships.some(
      (m) =>
        m.status === "active" && roleMeetsMinimum(m.role, "church_admin")
    );
    const canAccess =
      isSuperAdmin ||
      hasActiveOrgMembership ||
      hasActiveBranchMembership ||
      hasPendingBranchMembership ||
      hasAdminBranchRole;

    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (
      !isSuperAdmin &&
      isOrganizationAccessSuspended(snapshot.organization.status)
    ) {
      return NextResponse.json(
        { error: "organization_suspended" },
        { status: 403 }
      );
    }

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("[api/organization]", error);
    return NextResponse.json(
      { error: "Failed to load organization" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const decoded = await verifyBearerToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let body: { name?: string } = {};
    try {
      body = (await request.json()) as { name?: string };
    } catch {
      // optional body
    }

    const hadOrganization = (await getOrganizationsForUser(decoded.uid)).length > 0;

    const org = await ensureOrganizationForUser(
      decoded.uid,
      body.name?.trim() || "My Organization"
    );

    if (!hadOrganization) {
      const appUser = await getAppUserByClerkId(decoded.uid);
      const creatorName =
        `${appUser?.firstName ?? ""} ${appUser?.lastName ?? ""}`.trim() || "—";
      triggerOrganizationCreatedAdminEmail({
        organizationId: org.id,
        organizationName: org.name,
        workspaceType: org.settings?.workspaceType ?? "independent_church",
        creatorName,
        creatorEmail: decoded.email?.trim() || appUser?.email?.trim() || "—",
      });
    }

    const snapshot = await getOrganizationSnapshot(org.id, decoded.uid);
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("[api/organization] POST", error);
    return NextResponse.json(
      { error: "Failed to ensure organization" },
      { status: 500 }
    );
  }
}
