import { NextResponse } from "next/server";

import { groupChatErrorResponse } from "@/app/api/groups/[id]/messages/chat-http";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import { listGroupThread } from "@/lib/postgres/group-chat";

type RouteContext = { params: Promise<{ id: string; messageId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const verified = await verifyBearerToken(request);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: groupId, messageId } = await context.params;
  try {
    const thread = await listGroupThread({
      clerkId: verified.uid,
      groupId,
      messageId,
    });
    return NextResponse.json(thread);
  } catch (error) {
    return groupChatErrorResponse(error);
  }
}
