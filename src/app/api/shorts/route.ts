import { NextResponse } from "next/server";

import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import {
  PUBLIC_PLATFORM_CONTENT_QUERY,
  tenantContentQuery,
} from "@/lib/content/content-scope";
import {
  createShortDraft,
  listShortsForScope,
} from "@/lib/postgres/shorts";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import { getChurchById } from "@/lib/postgres/tenants";
import {
  SHORT_CATEGORIES,
  type ShortCategory,
  type ShortVisibility,
  type ShortsFeedFilter,
} from "@/types/video-short";

function parseCategory(value: unknown): ShortCategory {
  if (typeof value === "string" && SHORT_CATEGORIES.includes(value as ShortCategory)) {
    return value as ShortCategory;
  }
  return "Other";
}

function parseVisibility(value: unknown): ShortVisibility {
  return value === "public" ? "public" : "church";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter = (searchParams.get("filter") === "latest"
    ? "latest"
    : "church") as ShortsFeedFilter;
  const queryText = (searchParams.get("q") ?? "").trim().slice(0, 120);
  const churchIdParam = searchParams.get("churchId")?.trim() ?? "";
  const contentMode = searchParams.get("contentMode")?.trim();

  let contentQuery = PUBLIC_PLATFORM_CONTENT_QUERY;
  if (contentMode === "tenant" && churchIdParam) {
    const church = await getChurchById(churchIdParam);
    if (!church?.organizationId) {
      return NextResponse.json({ shorts: [] });
    }
    contentQuery = tenantContentQuery({
      organizationId: church.organizationId,
      churchId: church.id,
    });
  }

  const verified = await verifyBearerToken(request).catch(() => null);

  const shorts = await listShortsForScope({
    query: contentQuery,
    filter,
    queryText,
    viewerClerkId: verified?.uid ?? null,
    viewerEmail: verified?.email,
  });

  return NextResponse.json({ shorts });
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
    if (requestedScope === "platform_public") {
      const appUser = await getAppUserByClerkId(verified.uid);
      if (!isPlatformSuperAdmin(appUser?.platformRole)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const short = await createShortDraft({
        clerkId: verified.uid,
        email: verified.email,
        contentScope: "platform_public",
        caption: typeof body.caption === "string" ? body.caption : "",
        category: parseCategory(body.category),
        visibility: "public",
      });

      return NextResponse.json({
        id: short.id,
        contentScope: short.contentScope,
        churchId: short.churchId,
        organizationId: short.organizationId,
      });
    }

    const churchId =
      typeof body.churchId === "string" ? body.churchId.trim() : "";
    if (!churchId) {
      return NextResponse.json({ error: "No active church context" }, { status: 400 });
    }

    const short = await createShortDraft({
      clerkId: verified.uid,
      email: verified.email,
      churchId,
      contentScope: "organization",
      caption: typeof body.caption === "string" ? body.caption : "",
      category: parseCategory(body.category),
      visibility: parseVisibility(body.visibility),
    });

    return NextResponse.json({
      id: short.id,
      contentScope: short.contentScope,
      churchId: short.churchId,
      organizationId: short.organizationId,
    });
  } catch (error) {
    console.error("[api/shorts]", error);
    const raw = error instanceof Error ? error.message : "";
    if (raw === "Forbidden" || raw.toLowerCase().includes("member")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (raw.toLowerCase().includes("church context")) {
      return NextResponse.json(
        { error: "No active church context." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create Short." },
      { status: 500 }
    );
  }
}
