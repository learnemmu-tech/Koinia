import { NextResponse } from "next/server";

import { verifyBearerToken } from "@/lib/email/verify-auth";
import {
  deleteChurchVideo,
  getChurchVideoForViewer,
  updateChurchVideo,
} from "@/lib/postgres/church-videos";
import { SHORT_CATEGORIES, type ShortCategory } from "@/types/video-short";

type RouteContext = { params: Promise<{ id: string }> };

function parseCategory(value: unknown): ShortCategory | undefined {
  if (typeof value === "string" && SHORT_CATEGORIES.includes(value as ShortCategory)) {
    return value as ShortCategory;
  }
  return undefined;
}

function parseTags(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((tag): tag is string => typeof tag === "string");
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const verified = await verifyBearerToken(request).catch(() => null);
  const video = await getChurchVideoForViewer(
    id,
    verified?.uid ?? null,
    verified?.email
  );
  if (!video) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(video);
}

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
    const video = await updateChurchVideo({
      videoId: id,
      clerkId: verified.uid,
      email: verified.email,
      title: typeof body.title === "string" ? body.title : undefined,
      description:
        typeof body.description === "string" ? body.description : undefined,
      externalUrl:
        typeof body.externalUrl === "string" ? body.externalUrl : undefined,
      thumbnailUrl:
        typeof body.thumbnailUrl === "string" || body.thumbnailUrl === null
          ? (body.thumbnailUrl as string | null)
          : undefined,
      category: parseCategory(body.category),
      tags: parseTags(body.tags),
      published: typeof body.published === "boolean" ? body.published : undefined,
    });
    return NextResponse.json(video);
  } catch (error) {
    const raw = error instanceof Error ? error.message : "";
    if (raw === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (raw === "Video not found") {
      return NextResponse.json({ error: "Video not found." }, { status: 404 });
    }
    if (raw.toLowerCase().includes("youtube") || raw.toLowerCase().includes("title")) {
      return NextResponse.json({ error: raw }, { status: 400 });
    }
    console.error("[api/videos PATCH]", error);
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const verified = await verifyBearerToken(request);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    await deleteChurchVideo({
      videoId: id,
      clerkId: verified.uid,
      email: verified.email,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const raw = error instanceof Error ? error.message : "";
    if (raw === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (raw === "Video not found") {
      return NextResponse.json({ error: "Video not found." }, { status: 404 });
    }
    console.error("[api/videos DELETE]", error);
    return NextResponse.json({ error: "Delete failed." }, { status: 500 });
  }
}
