import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { createPrivacyRequest, listOwnPrivacyRequests } from "@/lib/legal/repository";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const appUser = await getAppUserByClerkId(userId);
  if (!appUser) return NextResponse.json({ requests: [] });
  const requests = await listOwnPrivacyRequests(appUser.id);
  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const appUser = await getAppUserByClerkId(userId);
  if (!appUser) return NextResponse.json({ error: "Account is not ready." }, { status: 409 });
  const body = (await request.json()) as { requestType?: string; details?: string };
  const result = await createPrivacyRequest({
    userId: appUser.id,
    requestType: body.requestType ?? "",
    details: body.details ?? "",
  });
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 400 });
  return NextResponse.json({ ok: true, id: result.id });
}
