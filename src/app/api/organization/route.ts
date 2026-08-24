import { NextResponse } from "next/server";

import { resolveIsAdmin } from "@/lib/admin-access";
import { roleMeetsMinimum } from "@/types/membership";
import { getBranchMembershipsForUser } from "@/lib/organization/branch-membership-server";
import {
  ensureOrganizationForUser,
  getMembershipForUser,
  getOrganizationSnapshot,
  getOrganizationsForUser,
} from "@/lib/organization/organization-server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId")?.trim();

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ?
    authHeader.slice(7)
  : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminDb = getAdminDb();
  if (!adminDb) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  try {
    const { getAuth } = await import("firebase-admin/auth");
    const decoded = await getAuth().verifyIdToken(token);
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

    const membership = await getMembershipForUser(targetOrgId, userId);
    const branchMemberships = (await getBranchMembershipsForUser(userId)).filter(
      (m) => m.organizationId === targetOrgId
    );
    const isAdmin = resolveIsAdmin(decoded.email);
    const hasActiveOrgMembership = membership?.status === "active";
    const hasActiveBranchMembership = branchMemberships.some(
      (m) => m.status === "active"
    );
    const hasAdminBranchRole = branchMemberships.some(
      (m) =>
        m.status === "active" && roleMeetsMinimum(m.role, "church_admin")
    );
    const canAccess =
      isAdmin ||
      hasActiveOrgMembership ||
      hasActiveBranchMembership ||
      hasAdminBranchRole;

    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const snapshot = await getOrganizationSnapshot(targetOrgId, userId);
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
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ?
    authHeader.slice(7)
  : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { getAuth } = await import("firebase-admin/auth");
    const decoded = await getAuth().verifyIdToken(token);

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
