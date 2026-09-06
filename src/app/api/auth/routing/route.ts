import { NextResponse } from "next/server";

import { resolveUserMembershipRouting } from "@/lib/auth/membership-routing-server";
import { resolveEffectiveCallbackUrl } from "@/lib/auth/resolve-effective-callback-url";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import { timed } from "@/lib/perf";

export async function GET(request: Request) {
  const decoded = await timed("routing.auth", () => verifyBearerToken(request));
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const callbackUrl = await resolveEffectiveCallbackUrl(
    searchParams.get("callbackUrl")
  );

  try {
    const routing = await timed("routing.resolve", () =>
      resolveUserMembershipRouting(decoded.uid, callbackUrl)
    );

    return NextResponse.json(routing);
  } catch (error) {
    console.error("[api/auth/routing]", error);
    return NextResponse.json(
      { error: "Failed to resolve routing" },
      { status: 500 }
    );
  }
}
