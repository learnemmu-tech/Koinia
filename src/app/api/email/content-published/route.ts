import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyChurchContentPublisher } from "@/lib/auth/verify-church-content-publisher";
import {
  triggerContentAnnouncementEmails,
  type ContentPublishEmailType,
} from "@/lib/email/triggers";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import { getAdminDb } from "@/lib/firebase-admin";

const bodySchema = z.object({
  type: z.enum(["song", "sermon", "article", "donation_campaign"]),
  contentId: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const authUser = await verifyBearerToken(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminDb = getAdminDb();
  if (!adminDb) {
    console.warn("[api/email/content-published] admin not configured");
    return NextResponse.json({ success: true });
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
    void triggerContentAnnouncementEmails(
      body.type as ContentPublishEmailType,
      body.contentId
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/email/content-published]", error);
    return NextResponse.json({ success: true });
  }
}
