import { NextResponse } from "next/server";

import { communityChatErrorResponse } from "@/app/api/community/messages/chat-http";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import { reportCommunityMessage } from "@/lib/postgres/community-chat";

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
    body = {};
  }

  try {
    const result = await reportCommunityMessage({
      clerkId: verified.uid,
      messageId: id,
      reason: typeof body.reason === "string" ? body.reason : "",
    });
    return NextResponse.json(result);
  } catch (error) {
    return communityChatErrorResponse(error);
  }
}
