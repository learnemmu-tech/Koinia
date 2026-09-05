import { NextResponse } from "next/server";

import { verifyBearerToken } from "@/lib/email/verify-auth";
import {
  addShortComment,
  deleteShortComment,
  getShortCommentsForViewer,
} from "@/lib/postgres/shorts";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const verified = await verifyBearerToken(request).catch(() => null);

  try {
    const comments = await getShortCommentsForViewer(
      id,
      verified?.uid ?? null,
      verified?.email
    );
    return NextResponse.json({ comments });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Comments unavailable.";
    const status = message === "Short not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request, context: RouteContext) {
  const verified = await verifyBearerToken(request);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: { body?: string } = {};
  try {
    body = (await request.json()) as { body?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const comment = await addShortComment({
      shortId: id,
      clerkId: verified.uid,
      email: verified.email,
      body: body.body ?? "",
    });
    return NextResponse.json({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Comment failed.";
    const status =
      message === "Short not found." ? 404
      : message === "Unauthorized" ? 401
      : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request, _context: RouteContext) {
  const verified = await verifyBearerToken(request);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const commentId = searchParams.get("commentId");
  if (!commentId) {
    return NextResponse.json({ error: "commentId is required" }, { status: 400 });
  }

  try {
    await deleteShortComment({
      commentId,
      clerkId: verified.uid,
      email: verified.email,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed.";
    const status = message === "Unauthorized" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
