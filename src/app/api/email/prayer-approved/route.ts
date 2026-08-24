import { NextResponse } from "next/server";
import { z } from "zod";

import {
  canUserModerateChurchPrayers,
  triggerPrayerApprovedEmail,
  triggerPrayerApprovedMemberNotifications,
} from "@/lib/email/triggers";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import { isPlatformSuperAdmin } from "@/lib/church-access";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  normalizePrayerRequestFromFirestore,
  PRAYER_REQUESTS_COLLECTION,
} from "@/lib/prayer-request-firestore";

const bodySchema = z.object({
  prayerId: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const authUser = await verifyBearerToken(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminDb = getAdminDb();
  if (!adminDb) {
    return NextResponse.json({ success: true });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
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
    const organizationId = String(prayerData.organizationId ?? "").trim() || undefined;

    const canModerate =
      isPlatformSuperAdmin(authUser.email) ||
      (await canUserModerateChurchPrayers({
        userId: authUser.uid,
        churchId: prayer.churchId,
        organizationId,
      }));

    if (!canModerate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await Promise.all([
      triggerPrayerApprovedMemberNotifications(body.prayerId),
      triggerPrayerApprovedEmail(body.prayerId),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/email/prayer-approved]", error);
    return NextResponse.json({ success: true });
  }
}
