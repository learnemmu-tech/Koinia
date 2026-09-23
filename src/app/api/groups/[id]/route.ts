import { NextResponse } from "next/server";

import { verifyBearerToken } from "@/lib/email/verify-auth";
import { groupErrorResponse } from "@/lib/groups-http";
import {
  archiveChurchGroup,
  getChurchGroupDetail,
  updateChurchGroup,
} from "@/lib/postgres/groups";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const verified = await verifyBearerToken(request);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  try {
    const group = await getChurchGroupDetail({
      clerkId: verified.uid,
      email: verified.email,
      groupId: id,
    });
    return NextResponse.json(group);
  } catch (error) {
    return groupErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const verified = await verifyBearerToken(request);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const group = await updateChurchGroup({
      clerkId: verified.uid,
      email: verified.email,
      groupId: id,
      name: typeof body.name === "string" ? body.name : undefined,
      description:
        typeof body.description === "string" ? body.description : undefined,
      imageUrl:
        body.imageUrl === null
          ? null
          : typeof body.imageUrl === "string"
            ? body.imageUrl
            : undefined,
    });
    return NextResponse.json(group);
  } catch (error) {
    return groupErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const verified = await verifyBearerToken(request);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  try {
    await archiveChurchGroup({
      clerkId: verified.uid,
      email: verified.email,
      groupId: id,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return groupErrorResponse(error);
  }
}
