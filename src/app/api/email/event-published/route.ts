import { NextResponse } from "next/server";
import { z } from "zod";

import { resolveIsAdmin } from "@/lib/admin-access";
import { triggerEventAnnouncementEmails } from "@/lib/email/triggers";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import { verifyChurchContentPublisher } from "@/lib/auth/verify-church-content-publisher";

const bodySchema = z.object({
  eventId: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const authUser = await verifyBearerToken(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUser = await getAppUserByClerkId(authUser.uid);
  const isAdmin =
    resolveIsAdmin(authUser.email) || appUser?.platformRole === "admin";
  const canPublish = await verifyChurchContentPublisher(
    authUser.uid,
    authUser.email
  );

  if (!isAdmin && !canPublish) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    void triggerEventAnnouncementEmails(body.eventId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/email/event-published]", error);
    return NextResponse.json({ success: true });
  }
}
