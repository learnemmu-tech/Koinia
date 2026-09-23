import { NextResponse } from "next/server";

import { groupChatErrorResponse } from "@/app/api/groups/[id]/messages/chat-http";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import { reportGroupMessage } from "@/lib/postgres/group-chat";

type RouteContext = { params: Promise<{ id: string; messageId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const verified = await verifyBearerToken(request);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: groupId, messageId } = await context.params;
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  try {
    const result = await reportGroupMessage({
      clerkId: verified.uid,
      groupId,
      messageId,
      reason: typeof body.reason === "string" ? body.reason : "",
    });
    return NextResponse.json(result);
  } catch (error) {
    return groupChatErrorResponse(error);
  }
}
