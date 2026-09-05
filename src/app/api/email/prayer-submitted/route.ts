import { NextResponse } from "next/server";
import { z } from "zod";

import {
  triggerPrayerRequestSubmittedNotifications,
  triggerPrayerSubmittedEmails,
} from "@/lib/email/triggers";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import { getPrayerRequestDisplayName } from "@/lib/prayer-request-firestore";
import { getPrayerRequestById } from "@/lib/firebase-prayer-request-queries";
import { getChurchById } from "@/lib/church-queries";

const bodySchema = z.object({
  prayerId: z.string().trim().min(1),
  prayerTitle: z.string().trim().min(1).max(100),
});

export async function POST(request: Request) {
  const authUser = await verifyBearerToken(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    const json = await request.json();
    body = bodySchema.parse(json);
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const prayer = await getPrayerRequestById(body.prayerId);
    if (!prayer) {
      return NextResponse.json({ error: "Prayer request not found." }, { status: 404 });
    }

    if (prayer.userId !== authUser.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const userEmail = prayer.email ?? authUser.email;
    if (!userEmail?.trim()) {
      return NextResponse.json({ success: true });
    }

    const church = await getChurchById(prayer.churchId);
    const memberName = getPrayerRequestDisplayName(prayer);

    await triggerPrayerRequestSubmittedNotifications({
      prayerId: prayer.id,
      churchId: prayer.churchId,
      organizationId: church?.organizationId,
      branchId: prayer.churchId,
      submitterUserId: authUser.uid,
      memberName,
      prayerTitle: body.prayerTitle || prayer.title,
    });

    triggerPrayerSubmittedEmails({
      prayerId: prayer.id,
      prayerTitle: body.prayerTitle || prayer.title,
      userId: authUser.uid,
      userEmail: userEmail.trim(),
      userName: getPrayerRequestDisplayName(prayer),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/email/prayer-submitted]", error);
    return NextResponse.json({ success: true });
  }
}
