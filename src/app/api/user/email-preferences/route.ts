import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  DEFAULT_EMAIL_PREFERENCES,
  normalizeEmailPreferences,
} from "@/lib/email/preferences";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import { getAdminDb } from "@/lib/firebase-admin";

const preferencesSchema = z.object({
  song: z.boolean(),
  sermon: z.boolean(),
  article: z.boolean(),
  event: z.boolean(),
  donation: z.boolean(),
  prayer: z.boolean(),
});

export async function GET(request: Request) {
  const authUser = await verifyBearerToken(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminDb = getAdminDb();
  if (!adminDb) {
    return NextResponse.json({ preferences: DEFAULT_EMAIL_PREFERENCES });
  }

  try {
    const snap = await adminDb.collection("users").doc(authUser.uid).get();
    if (!snap.exists) {
      return NextResponse.json({ preferences: DEFAULT_EMAIL_PREFERENCES });
    }

    const data = snap.data() as Record<string, unknown>;
    return NextResponse.json({
      preferences: normalizeEmailPreferences(data.emailPreferences),
    });
  } catch (error) {
    console.error("[api/user/email-preferences GET]", error);
    return NextResponse.json({ preferences: DEFAULT_EMAIL_PREFERENCES });
  }
}

export async function PATCH(request: Request) {
  const authUser = await verifyBearerToken(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof preferencesSchema>;
  try {
    body = preferencesSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid preferences." }, { status: 400 });
  }

  const adminDb = getAdminDb();
  if (!adminDb) {
    return NextResponse.json(
      { error: "Server is not configured." },
      { status: 503 }
    );
  }

  try {
    const userRef = adminDb.collection("users").doc(authUser.uid);
    const existing = await userRef.get();

    if (!existing.exists) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    await userRef.update({
      emailPreferences: body,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, preferences: body });
  } catch (error) {
    console.error("[api/user/email-preferences PATCH]", error);
    return NextResponse.json(
      { error: "Unable to save preferences. Please try again." },
      { status: 500 }
    );
  }
}
