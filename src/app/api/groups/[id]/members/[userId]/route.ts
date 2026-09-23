import { NextResponse } from "next/server";

import { verifyBearerToken } from "@/lib/email/verify-auth";
import { groupErrorResponse } from "@/lib/groups-http";
import {
  removeChurchGroupMember,
  transferChurchGroupOwnership,
  updateChurchGroupMemberRole,
} from "@/lib/postgres/groups";

type RouteContext = { params: Promise<{ id: string; userId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const verified = await verifyBearerToken(request);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, userId } = await context.params;
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    if (body.transferOwnership === true) {
      await transferChurchGroupOwnership({
        clerkId: verified.uid,
        email: verified.email,
        groupId: id,
        memberUserId: userId,
      });
      return NextResponse.json({ success: true, role: "owner" });
    }

    const role = body.role;
    if (role !== "admin" && role !== "member") {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }
    const nextRole = await updateChurchGroupMemberRole({
      clerkId: verified.uid,
      email: verified.email,
      groupId: id,
      memberUserId: userId,
      role,
    });
    return NextResponse.json({ success: true, role: nextRole });
  } catch (error) {
    return groupErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const verified = await verifyBearerToken(request);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, userId } = await context.params;
  try {
    await removeChurchGroupMember({
      clerkId: verified.uid,
      email: verified.email,
      groupId: id,
      memberUserId: userId,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return groupErrorResponse(error);
  }
}
