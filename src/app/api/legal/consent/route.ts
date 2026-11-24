import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { setConsentPreference } from "@/lib/legal/repository";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const appUser = await getAppUserByClerkId(userId);
  if (!appUser) return NextResponse.json({ error: "Account is not ready." }, { status: 409 });
  const body = (await request.json()) as { purpose?: string; granted?: boolean };
  const result = await setConsentPreference({
    userId: appUser.id,
    purpose: body.purpose ?? "",
    granted: Boolean(body.granted),
  });
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 400 });
  return NextResponse.json({ ok: true });
}
