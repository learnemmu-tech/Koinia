import { NextResponse } from "next/server";

import { verifyBearerToken } from "@/lib/email/verify-auth";
import { groupErrorResponse } from "@/lib/groups-http";
import {
  getGroupPreviewByToken,
  joinGroupByInviteToken,
  userIsApprovedChurchMember,
} from "@/lib/postgres/groups";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { token } = await context.params;
  const preview = await getGroupPreviewByToken(token);
  if (!preview) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const verified = await verifyBearerToken(request).catch(() => null);
  let canJoin = false;
  if (verified) {
    canJoin = await userIsApprovedChurchMember(
      verified.uid,
      preview.churchId,
      preview.organizationId
    );
  }

  return NextResponse.json({
    name: preview.name,
    description: preview.description,
    imageUrl: preview.imageUrl,
    churchName: preview.churchName,
    churchJoinSlug: preview.churchJoinSlug,
    canJoin,
  });
}

export async function POST(request: Request, context: RouteContext) {
  const verified = await verifyBearerToken(request);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { token } = await context.params;
  try {
    const result = await joinGroupByInviteToken({
      clerkId: verified.uid,
      email: verified.email,
      token,
    });
    return NextResponse.json(result);
  } catch (error) {
    return groupErrorResponse(error);
  }
}
