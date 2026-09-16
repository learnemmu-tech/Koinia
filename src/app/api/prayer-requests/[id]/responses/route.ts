import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyBearerToken } from "@/lib/email/verify-auth";
import {
  createPrayerResponse,
  deletePrayerResponse,
  listPrayerResponses,
  reportPrayerResponse,
  togglePrayerResponseLike,
  updatePrayerResponse,
} from "@/lib/postgres/prayer-responses";

type RouteContext = { params: Promise<{ id: string }> };

const contentSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  parentId: z.string().uuid().nullable().optional(),
});

function errorResponse(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";
  if (message === "Unauthorized") return NextResponse.json({ error: message }, { status: 401 });
  if (message.includes("not found")) return NextResponse.json({ error: message }, { status: 404 });
  return NextResponse.json({ error: message || fallback }, { status: 400 });
}

export async function GET(request: Request, context: RouteContext) {
  const auth = await verifyBearerToken(request).catch(() => null);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  try {
    return NextResponse.json(
      await listPrayerResponses({ requestId: id, clerkId: auth.uid, email: auth.email })
    );
  } catch (error) {
    return errorResponse(error, "Responses unavailable.");
  }
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await verifyBearerToken(request).catch(() => null);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  try {
    const body = contentSchema.parse(await request.json());
    const response = await createPrayerResponse({
      requestId: id,
      clerkId: auth.uid,
      email: auth.email,
      content: body.content,
      parentId: body.parentId,
    });
    return NextResponse.json({
      id: response.id,
      parentId: response.parentId,
      content: response.content,
      createdAt: response.createdAt.toISOString(),
    });
  } catch (error) {
    return errorResponse(error, "Response failed.");
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await verifyBearerToken(request).catch(() => null);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const responseId = new URL(request.url).searchParams.get("responseId") ?? "";
  try {
    const body = z.object({ content: z.string().trim().min(1).max(2000) }).parse(await request.json());
    const response = await updatePrayerResponse({
      requestId: id,
      responseId,
      clerkId: auth.uid,
      email: auth.email,
      content: body.content,
    });
    return NextResponse.json({ id: response?.id });
  } catch (error) {
    return errorResponse(error, "Response update failed.");
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await verifyBearerToken(request).catch(() => null);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const responseId = new URL(request.url).searchParams.get("responseId") ?? "";
  try {
    await deletePrayerResponse({ requestId: id, responseId, clerkId: auth.uid, email: auth.email });
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "Response deletion failed.");
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await verifyBearerToken(request).catch(() => null);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  try {
    const body = z.object({ action: z.enum(["like", "report"]), responseId: z.string().uuid(), reason: z.string().max(500).optional() }).parse(await request.json());
    if (body.action === "like") {
      return NextResponse.json(await togglePrayerResponseLike({ requestId: id, responseId: body.responseId, clerkId: auth.uid, email: auth.email }));
    }
    await reportPrayerResponse({ requestId: id, responseId: body.responseId, clerkId: auth.uid, email: auth.email, reason: body.reason });
    return NextResponse.json({ reported: true });
  } catch (error) {
    return errorResponse(error, "Response action failed.");
  }
}
