import { NextResponse } from "next/server";

import { acceptInvitation } from "@/lib/organization/invitation-server";

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
