import { NextResponse } from "next/server";

import { resolveUserMembershipRouting } from "@/lib/auth/membership-routing-server";
import { resolveEffectiveCallbackUrl } from "@/lib/auth/resolve-effective-callback-url";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import { createRequestTimer, timed } from "@/lib/perf";

export async function GET(request: Request) {
  const timer = createRequestTimer("routing");
  const decoded = await timed("routing.auth", () => verifyBearerToken(request));
  timer.mark("auth");
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const callbackUrl = await resolveEffectiveCallbackUrl(
    searchParams.get("callbackUrl")
  );
  timer.mark("callback");

  try {
    const routing = await timed("routing.resolve", () =>
      resolveUserMembershipRouting(decoded.uid, callbackUrl)
    );
    timer.mark("resolve");
    timer.finish({ userId: decoded.uid.slice(0, 8) });

    return NextResponse.json(routing);
  } catch (error) {
    console.error("[api/auth/routing]", error);
    return NextResponse.json(
      { error: "Failed to resolve routing" },
      { status: 500 }
    );
  }
}
