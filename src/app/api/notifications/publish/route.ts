import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyChurchContentPublisher } from "@/lib/auth/verify-church-content-publisher";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import { createPublishNotificationServer } from "@/lib/firebase-notification-server";

const bodySchema = z.object({
  type: z.enum([
    "song",
    "article",
    "sermon",
    "event",
    "prayer",
    "prayer_request_submitted",
    "membership_approved",
  ]),
  contentId: z.string().trim().min(1),
  contentTitle: z.string().trim().min(1),
  image: z.string().optional(),
  churchId: z.string().trim().min(1),
  organizationId: z.string().optional(),
  branchId: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  const authUser = await verifyBearerToken(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const canPublish = await verifyChurchContentPublisher(
    authUser.uid,
    authUser.email
  );
  if (!canPublish) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const notificationId = await createPublishNotificationServer(body);
    return NextResponse.json({ success: true, notificationId });
  } catch (error) {
    console.error("[api/notifications/publish]", error);
    return NextResponse.json(
      { error: "Failed to create notifications." },
      { status: 500 }
    );
  }
}
