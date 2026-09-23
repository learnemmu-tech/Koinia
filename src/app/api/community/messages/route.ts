import { NextResponse } from "next/server";

import { verifyBearerToken } from "@/lib/email/verify-auth";
import {
  createCommunityMessage,
  listCommunityMessages,
} from "@/lib/postgres/community-chat";
import { communityChatErrorResponse } from "@/app/api/community/messages/chat-http";

export async function GET(request: Request) {
  const verified = await verifyBearerToken(request);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const before = url.searchParams.get("before")?.trim() || undefined;
  const limitRaw = url.searchParams.get("limit");
  const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;

  try {
    const page = await listCommunityMessages({
      clerkId: verified.uid,
      before,
      limit: Number.isFinite(limit) ? limit : undefined,
    });
    return NextResponse.json(page);
  } catch (error) {
    return communityChatErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const verified = await verifyBearerToken(request);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const message = await createCommunityMessage({
      clerkId: verified.uid,
      content: typeof body.content === "string" ? body.content : "",
      replyToMessageId:
        typeof body.replyToMessageId === "string"
          ? body.replyToMessageId
          : undefined,
    });
    return NextResponse.json(message);
  } catch (error) {
    return communityChatErrorResponse(error);
  }
}
