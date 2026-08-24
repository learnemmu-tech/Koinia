import { NextResponse } from "next/server";
import { z } from "zod";

import {
  triggerPrayerRequestSubmittedNotifications,
  triggerPrayerSubmittedEmails,
} from "@/lib/email/triggers";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  getPrayerRequestDisplayName,
  normalizePrayerRequestFromFirestore,
  PRAYER_REQUESTS_COLLECTION,
} from "@/lib/prayer-request-firestore";

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

  const adminDb = getAdminDb();
  if (!adminDb) {
    return NextResponse.json({ success: true });
  }

  try {
    const snap = await adminDb
      .collection(PRAYER_REQUESTS_COLLECTION)
      .doc(body.prayerId)
      .get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Prayer request not found." }, { status: 404 });
    }

    const prayer = normalizePrayerRequestFromFirestore(
      snap.id,
      snap.data() as Record<string, unknown>
    );
    const prayerData = snap.data() as Record<string, unknown>;

    if (prayer.userId !== authUser.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const userEmail = prayer.email ?? authUser.email;
    if (!userEmail?.trim()) {
      return NextResponse.json({ success: true });
    }

    const memberName = getPrayerRequestDisplayName(prayer);

    await triggerPrayerRequestSubmittedNotifications({
      prayerId: prayer.id,
      churchId: prayer.churchId,
      organizationId: String(prayerData.organizationId ?? "").trim() || undefined,
      branchId: String(prayerData.branchId ?? "").trim() || undefined,
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
