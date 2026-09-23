import { NextResponse } from "next/server";

import { verifyBearerToken } from "@/lib/email/verify-auth";
import { groupErrorResponse } from "@/lib/groups-http";
import { inviteChurchMemberToGroup } from "@/lib/postgres/groups";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const verified = await verifyBearerToken(request);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const result = await inviteChurchMemberToGroup({
      clerkId: verified.uid,
      email: verified.email,
      groupId: id,
      inviteeUserId: typeof body.userId === "string" ? body.userId : "",
    });
    return NextResponse.json(result);
  } catch (error) {
    return groupErrorResponse(error);
  }
}
