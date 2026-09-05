import { NextResponse } from "next/server";

import { acceptInvitation } from "@/lib/organization/invitation-server";
import { verifyBearerToken } from "@/lib/email/verify-auth";

export async function POST(request: Request) {
  const decoded = await verifyBearerToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { token?: string };
    const inviteToken = body.token?.trim();

    if (!inviteToken) {
      return NextResponse.json(
        { error: "Invitation token is required" },
        { status: 400 }
      );
    }

    const result = await acceptInvitation(
      inviteToken,
      decoded.uid,
      decoded.email
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/invitations/accept]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to accept invitation",
      },
      { status: 400 }
    );
  }
}
