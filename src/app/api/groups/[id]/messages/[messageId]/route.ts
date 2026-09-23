import { NextResponse } from "next/server";

import { groupChatErrorResponse } from "@/app/api/groups/[id]/messages/chat-http";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import { deleteGroupMessage, editGroupMessage } from "@/lib/postgres/group-chat";

type RouteContext = { params: Promise<{ id: string; messageId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const verified = await verifyBearerToken(request);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: groupId, messageId } = await context.params;
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const message = await editGroupMessage({
      clerkId: verified.uid,
      groupId,
      messageId,
      content: typeof body.content === "string" ? body.content : "",
    });
    return NextResponse.json(message);
  } catch (error) {
    return groupChatErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const verified = await verifyBearerToken(request);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: groupId, messageId } = await context.params;
  try {
    const message = await deleteGroupMessage({
      clerkId: verified.uid,
      groupId,
      messageId,
    });
    return NextResponse.json(message);
  } catch (error) {
    return groupChatErrorResponse(error);
  }
}
