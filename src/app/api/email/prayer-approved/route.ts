import { NextResponse } from "next/server";
import { z } from "zod";

import {
  canUserModerateChurchPrayers,
  triggerPrayerApprovedEmail,
  triggerPrayerApprovedMemberNotifications,
} from "@/lib/email/triggers";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import { isPlatformSuperAdmin } from "@/lib/church-access";
import { getPrayerRequestById } from "@/lib/firebase-prayer-request-queries";
import { getChurchById } from "@/lib/church-queries";

const bodySchema = z.object({
  prayerId: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const authUser = await verifyBearerToken(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const prayer = await getPrayerRequestById(body.prayerId);
    if (!prayer) {
      return NextResponse.json({ error: "Prayer request not found." }, { status: 404 });
    }

    const church = await getChurchById(prayer.churchId);
    const organizationId = church?.organizationId;

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
