import { NextResponse } from "next/server";

import { verifyBearerToken } from "@/lib/email/verify-auth";
import { resolveActiveChurchId } from "@/lib/church-server";
import {
  createShortDraft,
  listShortsForScope,
} from "@/lib/postgres/shorts";
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
  const query = (searchParams.get("q") ?? "").trim().slice(0, 120);

  const churchId = await resolveActiveChurchId();
  if (!churchId) {
    return NextResponse.json({ shorts: [] });
  }

  const church = await getChurchById(churchId);
  if (!church?.organizationId) {
    return NextResponse.json({ shorts: [] });
  }

  const verified = await verifyBearerToken(request).catch(() => null);

  const shorts = await listShortsForScope({
    scope: {
      organizationId: church.organizationId,
      churchId: church.id,
    },
    filter,
    query,
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

  const churchId = await resolveActiveChurchId();
  if (!churchId) {
    return NextResponse.json({ error: "No active church context" }, { status: 400 });
  }

  try {
    const short = await createShortDraft({
      clerkId: verified.uid,
      email: verified.email,
      churchId,
      caption: typeof body.caption === "string" ? body.caption : "",
      category: parseCategory(body.category),
      visibility: parseVisibility(body.visibility),
    });

    return NextResponse.json({
      id: short.id,
      churchId: short.churchId,
      organizationId: short.organizationId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create Short.";
    const status = message.includes("member") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
