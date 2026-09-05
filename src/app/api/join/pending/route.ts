import { NextResponse } from "next/server";

import { getPendingJoinRequestForUser } from "@/lib/organization/join-server";
import { verifyBearerToken } from "@/lib/email/verify-auth";

export async function GET(request: Request) {
  const decoded = await verifyBearerToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pending = await getPendingJoinRequestForUser(decoded.uid);

    if (!pending) {
      return NextResponse.json({ pending: null });
    }

    return NextResponse.json({ pending });
  } catch (error) {
    console.error("[api/join/pending]", error);
    return NextResponse.json(
      { error: "Failed to load join status" },
      { status: 500 }
    );
  }
}
