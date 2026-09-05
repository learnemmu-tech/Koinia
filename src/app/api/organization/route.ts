import { NextResponse } from "next/server";

import { resolveIsAdmin } from "@/lib/admin-access";
import { roleMeetsMinimum } from "@/types/membership";
import {
  ensureOrganizationForUser,
  getOrganizationSnapshot,
  getOrganizationsForUser,
} from "@/lib/organization/organization-server";
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

    let targetOrgId = organizationId;
    if (!targetOrgId) {
      const orgs = await getOrganizationsForUser(userId);
      if (orgs[0]) {
        targetOrgId = orgs[0].id;
      } else if (resolveIsAdmin(decoded.email)) {
        const ensured = await ensureOrganizationForUser(
          userId,
          "FaithConnectHub"
        );
        targetOrgId = ensured.id;
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

    const isAdmin = resolveIsAdmin(decoded.email);
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
      isAdmin ||
      hasActiveOrgMembership ||
      hasActiveBranchMembership ||
      hasPendingBranchMembership ||
      hasAdminBranchRole;

    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    const org = await ensureOrganizationForUser(
      decoded.uid,
      body.name?.trim() || "My Organization"
    );

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
