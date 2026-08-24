import { NextResponse } from "next/server";

import {
  createInvitation,
  listInvitationsForOrganization,
} from "@/lib/organization/invitation-server";
import { getMembershipForUser } from "@/lib/organization/organization-server";
import type { MembershipRole } from "@/types/membership";

const INVITE_ROLES: MembershipRole[] = [
  "org_admin",
  "church_admin",
  "branch_admin",
  "leader",
  "editor",
  "member",
  "volunteer",
];

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
    if (!membership || membership.status !== "active") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const invitations = await listInvitationsForOrganization(organizationId);
    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("[api/invitations] GET", error);
    return NextResponse.json(
      { error: "Failed to load invitations" },
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

    const body = (await request.json()) as {
      organizationId?: string;
      churchId?: string;
      branchId?: string;
      role?: MembershipRole;
      email?: string;
      deliveryMethod?: "email" | "link";
    };

    const organizationId = body.organizationId?.trim();
    const churchId = body.churchId?.trim();
    const branchId = body.branchId?.trim();
    const role = body.role;

    if (!organizationId || !churchId || !branchId || !role) {
      return NextResponse.json(
        { error: "organizationId, churchId, branchId, and role are required" },
        { status: 400 }
      );
    }

    if (!INVITE_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const deliveryMethod = body.deliveryMethod ?? (body.email ? "email" : "link");
    if (deliveryMethod === "email" && !body.email?.trim()) {
      return NextResponse.json(
        { error: "Email is required for email invitations" },
        { status: 400 }
      );
    }

    const invitation = await createInvitation({
      organizationId,
      churchId,
      branchId,
      role,
      email: body.email?.trim(),
      deliveryMethod,
      invitedBy: decoded.uid,
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      process.env.VERCEL_URL ?
        `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const inviteLink = `${baseUrl}/invite/${invitation.token}`;

    let emailSent = deliveryMethod !== "email";

    if (deliveryMethod === "email" && body.email?.trim()) {
      try {
        const emailRes = await fetch(`${baseUrl}/api/email/invitation`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: body.email.trim(),
            inviteLink,
            role,
          }),
        });

        emailSent = emailRes.ok;
        if (!emailRes.ok) {
          console.error(
            "[api/invitations] email dispatch failed:",
            await emailRes.text().catch(() => "unknown error")
          );
        }
      } catch (emailError) {
        emailSent = false;
        console.error("[api/invitations] email dispatch failed:", emailError);
      }
    }

    if (deliveryMethod === "email" && body.email?.trim() && !emailSent) {
      return NextResponse.json({
        invitation,
        inviteLink,
        invitationCreated: true,
        emailSent: false,
        message:
          "Invitation created but email failed to send. Copy the link and share it manually.",
      });
    }

    return NextResponse.json({
      invitation,
      inviteLink,
      invitationCreated: true,
      emailSent: deliveryMethod === "email" ? emailSent : undefined,
    });
  } catch (error) {
    console.error("[api/invitations] POST", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create invitation",
      },
      { status: 500 }
    );
  }
}
