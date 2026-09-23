import { NextResponse } from "next/server";

import { groupChatErrorResponse } from "@/app/api/groups/[id]/messages/chat-http";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import { createGroupMessage, listGroupMessages } from "@/lib/postgres/group-chat";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const verified = await verifyBearerToken(request);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: groupId } = await context.params;
  const url = new URL(request.url);
  const before = url.searchParams.get("before")?.trim() || undefined;
  const limitRaw = url.searchParams.get("limit");
  const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;

  try {
    const page = await listGroupMessages({
      clerkId: verified.uid,
      groupId,
      before,
      limit: Number.isFinite(limit) ? limit : undefined,
    });
    return NextResponse.json(page);
  } catch (error) {
    return groupChatErrorResponse(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  const verified = await verifyBearerToken(request);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: groupId } = await context.params;
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const message = await createGroupMessage({
      clerkId: verified.uid,
      groupId,
      content: typeof body.content === "string" ? body.content : "",
      replyToMessageId:
        typeof body.replyToMessageId === "string"
          ? body.replyToMessageId
          : undefined,
    });
    return NextResponse.json(message);
  } catch (error) {
    return groupChatErrorResponse(error);
  }
}
