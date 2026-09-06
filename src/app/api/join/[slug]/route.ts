import { NextResponse } from "next/server";

import {
  clearJoinIntentCookieOnResponse,
  setJoinIntentCookieOnResponse,
} from "@/lib/auth/join-intent-cookie";
import { getClerkIdentity, verifyBearerToken } from "@/lib/email/verify-auth";
import {
  getChurchByJoinSlug,
  joinUserToChurchBySlug,
} from "@/lib/organization/join-server";
import { rateLimitJoinRequest } from "@/lib/rate-limit";

type RouteContext = { params: Promise<{ slug: string }> };

function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const church = await getChurchByJoinSlug(slug);

  if (!church) {
    return NextResponse.json({ error: "Church not found" }, { status: 404 });
  }

  const response = NextResponse.json(church);
  if (church.slugStatus === "active") {
    return setJoinIntentCookieOnResponse(response, church.slug);
  }
  return response;
}

export async function POST(request: Request, context: RouteContext) {
  const verified = await verifyBearerToken(request);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = await rateLimitJoinRequest(clientIp(request));
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many join attempts. Please try again later." },
      {
        status: 429,
        headers: rate.retryAfterMs ?
          { "Retry-After": String(Math.ceil(rate.retryAfterMs / 1000)) }
        : undefined,
      }
    );
  }

  try {
    const { slug } = await context.params;
    const identity = await getClerkIdentity(verified.uid);

    const result = await joinUserToChurchBySlug(verified.uid, slug, {
      emailVerified: identity?.emailVerified ?? false,
    });
    return clearJoinIntentCookieOnResponse(
      NextResponse.json({
        churchName: result.churchName,
        status: result.status,
      })
    );
  } catch (error) {
    console.error("[api/join]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to join church",
      },
      { status: 500 }
    );
  }
}
