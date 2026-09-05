import { NextResponse } from "next/server";

import { verifyBearerToken } from "@/lib/email/verify-auth";
import { reportShort } from "@/lib/postgres/shorts";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const verified = await verifyBearerToken(request);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: { reason?: string } = {};
  try {
    body = (await request.json()) as { reason?: string };
  } catch {
    body = {};
  }

  try {
    await reportShort({
      shortId: id,
      clerkId: verified.uid,
      email: verified.email,
      reason: body.reason,
    });
    return NextResponse.json({ reported: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Report failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
