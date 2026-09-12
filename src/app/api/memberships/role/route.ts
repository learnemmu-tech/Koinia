import { NextResponse } from "next/server";

import { updateChurchMembershipRole } from "@/lib/organization/branch-membership-server";
import { getChurchMembershipRowById } from "@/lib/postgres/memberships";
import { userCanManageOrganization } from "@/lib/postgres/session";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import { isAssignableChurchRole } from "@/types/membership";

type RoleBody = {
  organizationId?: string;
  membershipId?: string;
  role?: string;
};

export async function POST(request: Request) {
  const decoded = await verifyBearerToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as RoleBody;
    const organizationId = body.organizationId?.trim();
    const membershipId = body.membershipId?.trim();
    const role = body.role?.trim();

    if (!organizationId || !membershipId || !role) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (!isAssignableChurchRole(role)) {
      return NextResponse.json(
        { error: "That role cannot be assigned." },
        { status: 400 }
      );
    }

    const target = await getChurchMembershipRowById(membershipId);
    if (!target) {
      return NextResponse.json({ error: "Membership not found" }, { status: 404 });
    }
    if (target.organizationId !== organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allowed = await userCanManageOrganization(decoded.uid, organizationId);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const membership = await updateChurchMembershipRole(
      membershipId,
      role,
      decoded.uid
    );

    return NextResponse.json({ success: true, membership });
  } catch (error) {
    console.error("[api/memberships/role]", error);
    return NextResponse.json(
      { error: "Failed to update role." },
      { status: 500 }
    );
  }
}
