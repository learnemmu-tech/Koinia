import { NextResponse } from "next/server";

import { getInvitationByToken } from "@/lib/organization/invitation-server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;

  if (!token?.trim()) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  try {
    const invitation = await getInvitationByToken(token);
    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: invitation.status,
      role: invitation.role,
      organizationId: invitation.organizationId,
      churchId: invitation.churchId,
      branchId: invitation.branchId,
      expiresAt: invitation.expiresAt,
      email: invitation.email,
    });
  } catch (error) {
    console.error("[api/invitations/token]", error);
    return NextResponse.json(
      { error: "Failed to load invitation" },
      { status: 500 }
    );
  }
}
