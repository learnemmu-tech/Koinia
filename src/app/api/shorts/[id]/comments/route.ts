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
    console.error("[api/shorts/comments GET]", error);
    const raw = error instanceof Error ? error.message : "";
    if (raw === "Short not found.") {
      return NextResponse.json({ error: "Short not found." }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Comments unavailable." },
      { status: 400 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  const verified = await verifyBearerToken(request);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: { body?: string; parentId?: string | null } = {};
  try {
    body = (await request.json()) as { body?: string; parentId?: string | null };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const comment = await addShortComment({
      shortId: id,
      clerkId: verified.uid,
      email: verified.email,
      body: body.body ?? "",
      parentId: typeof body.parentId === "string" ? body.parentId : null,
    });
    return NextResponse.json({
      id: comment.id,
      body: comment.body,
      parentId: comment.parentId,
      createdAt: comment.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("[api/shorts/comments POST]", error);
    const raw = error instanceof Error ? error.message : "";
    if (raw === "Short not found." || raw === "Parent comment not found.") {
      return NextResponse.json({ error: raw }, { status: 404 });
    }
    if (raw === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Comment failed." }, { status: 400 });
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
    console.error("[api/shorts/comments DELETE]", error);
    const raw = error instanceof Error ? error.message : "";
    if (raw === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    return NextResponse.json({ error: "Delete failed." }, { status: 400 });
  }
}
