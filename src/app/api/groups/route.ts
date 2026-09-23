import { NextResponse } from "next/server";

import { verifyBearerToken } from "@/lib/email/verify-auth";
import { groupErrorResponse } from "@/lib/groups-http";
import { createChurchGroup, listChurchGroups } from "@/lib/postgres/groups";

export async function GET(request: Request) {
  const verified = await verifyBearerToken(request);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const churchId =
    new URL(request.url).searchParams.get("churchId")?.trim() ?? "";

  try {
    const groups = await listChurchGroups({
      clerkId: verified.uid,
      email: verified.email,
      churchId,
    });
    return NextResponse.json({ groups });
  } catch (error) {
    return groupErrorResponse(error);
  }
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

  try {
    const group = await createChurchGroup({
      clerkId: verified.uid,
      email: verified.email,
      churchId: typeof body.churchId === "string" ? body.churchId : "",
      name: typeof body.name === "string" ? body.name : "",
      description: typeof body.description === "string" ? body.description : "",
    });
    return NextResponse.json(group);
  } catch (error) {
    return groupErrorResponse(error);
  }
}
