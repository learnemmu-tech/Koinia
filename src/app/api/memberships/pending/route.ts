import { NextResponse } from "next/server";

import {
  approveBranchMembership,
  bulkReviewBranchMemberships,
  listPendingBranchMemberships,
  rejectBranchMembership,
  removeBranchMembership,
} from "@/lib/organization/branch-membership-server";
import { getMembershipForUser } from "@/lib/organization/organization-server";
import { roleMeetsMinimum } from "@/types/membership";
import { getAdminDb } from "@/lib/firebase-admin";

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
  const branchId = searchParams.get("branchId")?.trim();

  if (!organizationId || !branchId) {
    return NextResponse.json(
      { error: "organizationId and branchId are required" },
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

    const pending = await listPendingBranchMemberships(organizationId, branchId);
    const adminDb = getAdminDb();
    const usersById: Record<
      string,
      { email: string; firstName: string; lastName: string }
    > = {};

    if (adminDb) {
      await Promise.all(
        pending.map(async (item) => {
          const snap = await adminDb.collection("users").doc(item.userId).get();
          if (!snap.exists) return;
          const data = snap.data() as Record<string, unknown>;
          usersById[item.userId] = {
            email: String(data.email ?? ""),
            firstName: String(data.firstName ?? ""),
            lastName: String(data.lastName ?? ""),
          };
        })
      );
    }

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
    const body = (await request.json()) as ReviewBody;

    const organizationId = body.organizationId?.trim();
    const membershipId = body.membershipId?.trim();
    const membershipIds = Array.isArray(body.membershipIds) ?
        body.membershipIds.map((id) => String(id).trim()).filter(Boolean)
      : membershipId ? [membershipId]
      : [];
    const action = body.action;

    if (!organizationId || !membershipIds.length || !action) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const membership = await getMembershipForUser(organizationId, decoded.uid);
    if (
      !membership ||
      membership.status !== "active" ||
      !roleMeetsMinimum(membership.role, "church_admin")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    } else {
      if (action === "remove") {
        for (const membershipId of membershipIds) {
          await removeBranchMembership(membershipId, decoded.uid);
        }
      } else {
        await bulkReviewBranchMemberships(
          membershipIds,
          action,
          decoded.uid
        );
      }
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
