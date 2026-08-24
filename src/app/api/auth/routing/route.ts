import { NextResponse } from "next/server";

import { resolveUserMembershipRouting } from "@/lib/auth/membership-routing-server";
import { sanitizeCallbackUrl } from "@/lib/callback-url";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ?
    authHeader.slice(7)
  : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const callbackUrl = sanitizeCallbackUrl(searchParams.get("callbackUrl"), "/");

  try {
    const { getAuth } = await import("firebase-admin/auth");
    const decoded = await getAuth().verifyIdToken(token);
    const routing = await resolveUserMembershipRouting(
      decoded.uid,
      callbackUrl
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
