import { NextResponse } from "next/server";

import {
  listActiveBranchMemberships,
  listPendingBranchMemberships,
} from "@/lib/organization/branch-membership-server";
import { getPublicUserDirectory } from "@/lib/postgres/memberships";
import { getChurchById } from "@/lib/postgres/tenants";
import { userCanReviewChurchMemberships } from "@/lib/postgres/session";
import { verifyBearerToken } from "@/lib/email/verify-auth";

export async function GET(request: Request) {
  const decoded = await verifyBearerToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId")?.trim();
  const branchId = searchParams.get("branchId")?.trim();

  if (!organizationId || !branchId) {
    return NextResponse.json(
      { error: "organizationId and branchId are required" },
      { status: 400 }
    );
  }

  try {
    const allowed = await userCanReviewChurchMemberships(
      decoded.uid,
      decoded.email,
      branchId
    );
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const church = await getChurchById(branchId);
    if (!church || church.organizationId !== organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [pending, active] = await Promise.all([
      listPendingBranchMemberships(organizationId, branchId),
      listActiveBranchMemberships(organizationId, branchId),
    ]);

    const usersById = await getPublicUserDirectory(
      [...pending, ...active].map((item) => item.userId)
    );

    return NextResponse.json({ pending, active, usersById });
  } catch (error) {
    console.error("[api/memberships/branch]", error);
    return NextResponse.json(
      { error: "Failed to load members" },
      { status: 500 }
    );
  }
}
