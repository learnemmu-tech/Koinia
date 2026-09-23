import { NextResponse } from "next/server";

import { communityChatErrorResponse } from "@/app/api/community/messages/chat-http";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import { listCommunityThread } from "@/lib/postgres/community-chat";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const verified = await verifyBearerToken(_request);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const thread = await listCommunityThread({
      clerkId: verified.uid,
      messageId: id,
    });
    return NextResponse.json(thread);
  } catch (error) {
    return communityChatErrorResponse(error);
  }
}
