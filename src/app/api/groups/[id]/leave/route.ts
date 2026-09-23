import { NextResponse } from "next/server";

import { verifyBearerToken } from "@/lib/email/verify-auth";
import { groupErrorResponse } from "@/lib/groups-http";
import { leaveChurchGroup } from "@/lib/postgres/groups";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const verified = await verifyBearerToken(request);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  try {
    await leaveChurchGroup({
      clerkId: verified.uid,
      email: verified.email,
      groupId: id,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return groupErrorResponse(error);
  }
}
