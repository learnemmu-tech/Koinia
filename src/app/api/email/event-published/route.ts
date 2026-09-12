import { after, NextResponse } from "next/server";
import { z } from "zod";

import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";
import { verifyChurchContentPublisher } from "@/lib/auth/verify-church-content-publisher";
import { triggerEventAnnouncementEmails } from "@/lib/email/triggers";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import { getEventById } from "@/lib/postgres/features";
import { userCanManageChurch } from "@/lib/postgres/session";

const bodySchema = z.object({
  eventId: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const authUser = await verifyBearerToken(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUser = await getAppUserByClerkId(authUser.uid);
  const isSuperAdmin = isPlatformSuperAdmin(appUser?.platformRole);
  const canPublish = await verifyChurchContentPublisher(
    authUser.uid,
    authUser.email
  );

  if (!isSuperAdmin && !canPublish) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const event = await getEventById(body.eventId);
  if (!event?.churchId) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  if (!isSuperAdmin) {
    const mayAnnounce = await userCanManageChurch(
      authUser.uid,
      authUser.email,
      event.churchId
    );
    if (!mayAnnounce) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  after(() =>
    triggerEventAnnouncementEmails(body.eventId, authUser.uid).catch((error) => {
      console.error("[api/email/event-published]", error);
    })
  );

  return NextResponse.json({ success: true });
}
