import { NextResponse } from "next/server";

import { verifyBearerToken } from "@/lib/email/verify-auth";
import { userCanManageChurch } from "@/lib/postgres/session";
import {
  STORED_OBJECT_PURPOSES,
  STORED_OBJECT_VISIBILITIES,
  type StoredObjectPurpose,
  type StoredObjectVisibility,
} from "@/lib/storage/stored-object-rules";
import {
  StoredObjectError,
  createStoredObjectUpload,
} from "@/lib/storage/stored-objects";
import {
  assertChurchContentWritable,
  isSubscriptionLimitError,
} from "@/lib/subscription/subscription-server";
import { isPostgresUuid } from "@/lib/postgres/uuid";

export async function POST(request: Request) {
  try {
    const decoded = await verifyBearerToken(request);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = (await request.json()) as {
      churchId?: string;
      filename?: string;
      mimeType?: string;
      sizeBytes?: number;
      visibility?: string;
      purpose?: string;
      sha256?: string | null;
    };
    if (!body.churchId || !isPostgresUuid(body.churchId)) {
      return NextResponse.json({ error: "Invalid church." }, { status: 400 });
    }
    if (
      !body.purpose ||
      !STORED_OBJECT_PURPOSES.includes(body.purpose as StoredObjectPurpose) ||
      !body.visibility ||
      !STORED_OBJECT_VISIBILITIES.includes(body.visibility as StoredObjectVisibility)
    ) {
      return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
    }
    const allowed = await userCanManageChurch(decoded.uid, decoded.email, body.churchId);
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await assertChurchContentWritable(body.churchId);
    const created = await createStoredObjectUpload({
      clerkId: decoded.uid,
      churchId: body.churchId,
      filename: body.filename ?? "",
      mimeType: body.mimeType ?? "",
      sizeBytes: body.sizeBytes ?? 0,
      visibility: body.visibility as StoredObjectVisibility,
      purpose: body.purpose as StoredObjectPurpose,
      sha256: body.sha256,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof StoredObjectError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (isSubscriptionLimitError(error)) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("[storage/uploads]", error instanceof Error ? error.message : "failed");
    return NextResponse.json({ error: "Could not start upload." }, { status: 500 });
  }
}
