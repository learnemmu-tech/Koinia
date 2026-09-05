import { NextResponse } from "next/server";

import {
  listBranchMembershipsForOrganization,
  listOrganizationMemberships,
} from "@/lib/organization/branch-membership-server";
import { getMembershipForUser } from "@/lib/organization/organization-server";
import { getPublicUserDirectory } from "@/lib/postgres/memberships";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import { roleMeetsMinimum } from "@/types/membership";

export async function GET(request: Request) {
  const decoded = await verifyBearerToken(request);
  if (!decoded) {
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

    const userIds = [
      ...new Set([
        ...organizationMemberships.map((m) => m.userId),
        ...branchMemberships.map((m) => m.userId),
      ]),
    ];
    const usersById = await getPublicUserDirectory(userIds);

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
