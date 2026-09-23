import { NextResponse } from "next/server";

import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import {
  PUBLIC_PLATFORM_CONTENT_QUERY,
  tenantContentQuery,
} from "@/lib/content/content-scope";
import {
  createChurchVideo,
  listPublishedChurchVideos,
} from "@/lib/postgres/church-videos";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import { userCanManageChurch } from "@/lib/postgres/session";
import { getChurchById } from "@/lib/postgres/tenants";
import {
  assertChurchUsageAllowed,
  isSubscriptionLimitError,
} from "@/lib/subscription/subscription-server";
import { SHORT_CATEGORIES, type ShortCategory } from "@/types/video-short";

function parseCategory(value: unknown): ShortCategory {
  if (typeof value === "string" && SHORT_CATEGORIES.includes(value as ShortCategory)) {
    return value as ShortCategory;
  }
  return "Other";
}

function parseTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((tag): tag is string => typeof tag === "string");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const churchIdParam = searchParams.get("churchId")?.trim() ?? "";
  const contentMode = searchParams.get("contentMode")?.trim();

  let contentQuery = PUBLIC_PLATFORM_CONTENT_QUERY;
  if (contentMode === "tenant" && churchIdParam) {
    const church = await getChurchById(churchIdParam);
    if (!church?.organizationId) {
      return NextResponse.json({ videos: [] });
    }
    contentQuery = tenantContentQuery({
      organizationId: church.organizationId,
      churchId: church.id,
    });
  }

  const verified = await verifyBearerToken(request).catch(() => null);
  let includeUnpublished = false;
  if (verified?.uid) {
    if (contentQuery.contentMode === "platform_public") {
      const appUser = await getAppUserByClerkId(verified.uid);
      includeUnpublished = isPlatformSuperAdmin(appUser?.platformRole);
    } else if (churchIdParam) {
      includeUnpublished = await userCanManageChurch(
        verified.uid,
        verified.email,
        churchIdParam
      );
    }
  }

  const videos = await listPublishedChurchVideos({
    query: contentQuery,
    viewerClerkId: verified?.uid ?? null,
    viewerEmail: verified?.email,
    includeUnpublished,
  });

  return NextResponse.json({ videos });
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

  const requestedScope =
    body.contentScope === "platform_public" ? "platform_public" : "organization";

  try {
    if (requestedScope === "organization") {
      const churchId =
        typeof body.churchId === "string" ? body.churchId.trim() : "";
      if (!churchId) {
        return NextResponse.json(
          { error: "No active church context" },
          { status: 400 }
        );
      }
      await assertChurchUsageAllowed(churchId, "shorts");
    }

    const video = await createChurchVideo({
      clerkId: verified.uid,
      email: verified.email,
      churchId: typeof body.churchId === "string" ? body.churchId : undefined,
      contentScope: requestedScope,
      title: typeof body.title === "string" ? body.title : "",
      description: typeof body.description === "string" ? body.description : "",
      externalUrl: typeof body.externalUrl === "string" ? body.externalUrl : "",
      thumbnailUrl:
        typeof body.thumbnailUrl === "string" ? body.thumbnailUrl : null,
      category: parseCategory(body.category),
      tags: parseTags(body.tags),
      published: body.published !== false,
    });

    return NextResponse.json(video);
  } catch (error) {
    if (isSubscriptionLimitError(error)) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    const raw = error instanceof Error ? error.message : "";
    if (raw === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (raw.toLowerCase().includes("youtube") || raw.toLowerCase().includes("title")) {
      return NextResponse.json({ error: raw }, { status: 400 });
    }
    console.error("[api/videos]", error);
    return NextResponse.json({ error: "Failed to create video." }, { status: 500 });
  }
}
