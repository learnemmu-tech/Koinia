import { NextResponse } from "next/server";

import { verifyBearerToken } from "@/lib/email/verify-auth";
import { groupErrorResponse } from "@/lib/groups-http";
import { searchGroupInviteCandidates } from "@/lib/postgres/groups";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const verified = await verifyBearerToken(request);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const query = new URL(request.url).searchParams.get("q") ?? "";
  try {
    const candidates = await searchGroupInviteCandidates({
      clerkId: verified.uid,
      email: verified.email,
      groupId: id,
      query,
    });
    return NextResponse.json({ candidates });
  } catch (error) {
    return groupErrorResponse(error);
  }
}
