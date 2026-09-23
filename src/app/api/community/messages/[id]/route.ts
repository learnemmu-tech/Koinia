import { NextResponse } from "next/server";

import { communityChatErrorResponse } from "@/app/api/community/messages/chat-http";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import {
  deleteCommunityMessage,
  editCommunityMessage,
} from "@/lib/postgres/community-chat";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
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
    const message = await editCommunityMessage({
      clerkId: verified.uid,
      messageId: id,
      content: typeof body.content === "string" ? body.content : "",
    });
    return NextResponse.json(message);
  } catch (error) {
    return communityChatErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const verified = await verifyBearerToken(request);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const message = await deleteCommunityMessage({
      clerkId: verified.uid,
      messageId: id,
    });
    return NextResponse.json(message);
  } catch (error) {
    return communityChatErrorResponse(error);
  }
}
