import { NextResponse } from "next/server";

import { verifyBearerToken } from "@/lib/email/verify-auth";
import { groupErrorResponse } from "@/lib/groups-http";
import { regenerateGroupInviteToken } from "@/lib/postgres/groups";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const verified = await verifyBearerToken(request);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  try {
    const inviteToken = await regenerateGroupInviteToken({
      clerkId: verified.uid,
      email: verified.email,
      groupId: id,
    });
    return NextResponse.json({ inviteToken });
  } catch (error) {
    return groupErrorResponse(error);
  }
}
