import { NextResponse } from "next/server";

import { verifyBearerToken } from "@/lib/email/verify-auth";
import { groupErrorResponse } from "@/lib/groups-http";
import { respondToGroupInvitation } from "@/lib/postgres/groups";

type RouteContext = { params: Promise<{ invitationId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const verified = await verifyBearerToken(request);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { invitationId } = await context.params;
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const action = body.action === "decline" ? "decline" : body.action === "accept" ? "accept" : null;
  if (!action) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  try {
    const result = await respondToGroupInvitation({
      clerkId: verified.uid,
      email: verified.email,
      invitationId,
      action,
    });
    return NextResponse.json(result);
  } catch (error) {
    return groupErrorResponse(error);
  }
}
