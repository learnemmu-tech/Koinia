import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import {
  getAppUserByClerkId,
  mapAppUserToProfileWithWebsite,
} from "@/lib/postgres/app-user";
import { getStorageObjectKeyFromUrl } from "@/lib/storage/object-storage";

const NAME_MAX = 80;

function cleanName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed || trimmed.length > NAME_MAX) return null;
  return trimmed;
}

function ownPhotoUrl(uid: string, value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string") return undefined;
  const key = getStorageObjectKeyFromUrl(value.trim());
  const prefix = `profiles/${uid}/`;
  if (!key || !key.startsWith(prefix) || key.includes("..")) return undefined;
  return value.trim();
}

export async function PATCH(request: Request) {
  const verified = await verifyBearerToken(request);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await getAppUserByClerkId(verified.uid);
  if (!existing) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  let body: { firstName?: unknown; lastName?: unknown; photoUrl?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const firstName = cleanName(body.firstName);
  const lastName = cleanName(body.lastName);
  if (!firstName || !lastName) {
    return NextResponse.json(
      { error: "First name and last name are required." },
      { status: 400 }
    );
  }

  const photoUrl = ownPhotoUrl(verified.uid, body.photoUrl);
  if (body.photoUrl !== undefined && photoUrl === undefined) {
    return NextResponse.json({ error: "Invalid profile photo." }, { status: 400 });
  }

  const [updated] = await db
    .update(users)
    .set({
      firstName,
      lastName,
      ...(photoUrl !== undefined ? { photoUrl } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, existing.id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Failed to save profile." }, { status: 500 });
  }

  return NextResponse.json({
    profile: await mapAppUserToProfileWithWebsite(updated),
  });
}
