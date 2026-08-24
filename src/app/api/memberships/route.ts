import { NextResponse } from "next/server";

import {
  listBranchMembershipsForOrganization,
  listOrganizationMemberships,
} from "@/lib/organization/branch-membership-server";
import { getMembershipForUser } from "@/lib/organization/organization-server";
import { getAdminDb } from "@/lib/firebase-admin";
import { roleMeetsMinimum } from "@/types/membership";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ?
    authHeader.slice(7)
  : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId")?.trim();

  if (!organizationId) {
    return NextResponse.json(
      { error: "organizationId is required" },
      { status: 400 }
    );
  }

  try {
    const { getAuth } = await import("firebase-admin/auth");
    const decoded = await getAuth().verifyIdToken(token);

    const membership = await getMembershipForUser(organizationId, decoded.uid);
    if (
      !membership ||
      membership.status !== "active" ||
      !roleMeetsMinimum(membership.role, "church_admin")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [organizationMemberships, branchMemberships] = await Promise.all([
      listOrganizationMemberships(organizationId),
      listBranchMembershipsForOrganization(organizationId),
    ]);

    const adminDb = getAdminDb();
    const usersById: Record<string, { email: string; firstName: string; lastName: string }> = {};

    if (adminDb) {
      const userIds = [
        ...new Set([
          ...organizationMemberships.map((m) => m.userId),
          ...branchMemberships.map((m) => m.userId),
        ]),
      ];

      await Promise.all(
        userIds.map(async (userId) => {
          const snap = await adminDb.collection("users").doc(userId).get();
          if (!snap.exists) return;
          const data = snap.data() as Record<string, unknown>;
          usersById[userId] = {
            email: String(data.email ?? ""),
            firstName: String(data.firstName ?? ""),
            lastName: String(data.lastName ?? ""),
          };
        })
      );
    }

    return NextResponse.json({
      organizationMemberships,
      branchMemberships,
      usersById,
    });
  } catch (error) {
    console.error("[api/memberships]", error);
    return NextResponse.json(
      { error: "Failed to load memberships" },
      { status: 500 }
    );
  }
}
