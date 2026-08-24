import { NextResponse } from "next/server";

import { getPendingJoinRequestForUser } from "@/lib/organization/join-server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ?
    authHeader.slice(7)
  : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { getAuth } = await import("firebase-admin/auth");
    const decoded = await getAuth().verifyIdToken(token);
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
