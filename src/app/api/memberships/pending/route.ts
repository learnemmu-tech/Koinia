import { NextResponse } from "next/server";

import {
  approveBranchMembership,
  bulkReviewBranchMemberships,
  listPendingBranchMemberships,
  rejectBranchMembership,
  removeBranchMembership,
} from "@/lib/organization/branch-membership-server";
import {
  getChurchMembershipRowById,
  getPublicUserDirectory,
} from "@/lib/postgres/memberships";
import { getChurchById } from "@/lib/postgres/tenants";
import { userCanReviewChurchMemberships } from "@/lib/postgres/session";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import { timed } from "@/lib/perf";

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
    const allowed = await timed("pending.auth", () =>
      userCanReviewChurchMemberships(decoded.uid, decoded.email, branchId)
    );
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const church = await getChurchById(branchId);
    if (!church || church.organizationId !== organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const pending = await timed("pending.list", () =>
      listPendingBranchMemberships(organizationId, branchId)
    );
    const usersById = await timed("pending.directory", () =>
      getPublicUserDirectory(pending.map((item) => item.userId))
    );

    return NextResponse.json({ pending, usersById });
  } catch (error) {
    console.error("[api/memberships/pending]", error);
    return NextResponse.json(
      { error: "Failed to load pending members" },
      { status: 500 }
    );
  }
}

type ReviewBody = {
  organizationId?: string;
  membershipId?: string;
  membershipIds?: string[];
  action?: "approve" | "reject" | "remove";
};

export async function POST(request: Request) {
  const decoded = await verifyBearerToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as ReviewBody;

    const organizationId = body.organizationId?.trim();
    const membershipId = body.membershipId?.trim();
    const membershipIds = Array.isArray(body.membershipIds)
      ? body.membershipIds.map((id) => String(id).trim()).filter(Boolean)
      : membershipId
        ? [membershipId]
        : [];
    const action = body.action;

    if (!organizationId || !membershipIds.length || !action) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    for (const id of membershipIds) {
      const target = await getChurchMembershipRowById(id);
      if (!target) {
        return NextResponse.json({ error: "Membership not found" }, { status: 404 });
      }
      if (target.organizationId !== organizationId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const allowed = await userCanReviewChurchMemberships(
        decoded.uid,
        decoded.email,
        target.churchId
      );
      if (!allowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    if (membershipIds.length === 1) {
      if (action === "approve") {
        await approveBranchMembership(membershipIds[0]!, decoded.uid);
      } else if (action === "reject") {
        await rejectBranchMembership(membershipIds[0]!);
      } else if (action === "remove") {
        await removeBranchMembership(membershipIds[0]!, decoded.uid);
      } else {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
      }
    } else if (action === "remove") {
      for (const id of membershipIds) {
        await removeBranchMembership(id, decoded.uid);
      }
    } else if (action === "approve" || action === "reject") {
      await bulkReviewBranchMemberships(membershipIds, action, decoded.uid);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/memberships/pending]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to review member",
      },
      { status: 500 }
    );
  }
}
