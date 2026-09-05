import { NextResponse } from "next/server";

import { verifyBearerToken } from "@/lib/email/verify-auth";
import { toggleShortLike } from "@/lib/postgres/shorts";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const verified = await verifyBearerToken(_request);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const result = await toggleShortLike({
      shortId: id,
      clerkId: verified.uid,
      email: verified.email,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Like failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
