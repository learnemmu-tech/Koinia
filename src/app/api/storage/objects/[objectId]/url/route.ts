import { NextResponse } from "next/server";

import { verifyBearerToken } from "@/lib/email/verify-auth";
import { userCanAccessChurchContent } from "@/lib/postgres/session";
import { isPostgresUuid } from "@/lib/postgres/uuid";
import {
  StoredObjectError,
  presignObjectKey,
  readReadyObjectAccess,
} from "@/lib/storage/stored-objects";

export async function GET(
  request: Request,
  context: { params: Promise<{ objectId: string }> }
) {
  try {
    const decoded = await verifyBearerToken(request);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { objectId } = await context.params;
    if (!isPostgresUuid(objectId)) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    const row = await readReadyObjectAccess(objectId);
    if (row.visibility !== "private") {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    const allowed = await userCanAccessChurchContent(
      decoded.uid,
      decoded.email,
      row.churchId
    );
    if (!allowed) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const signed = await presignObjectKey(row.objectKey);
    return NextResponse.json(signed);
  } catch (error) {
    if (error instanceof StoredObjectError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[storage/private-url]", error instanceof Error ? error.message : "failed");
    return NextResponse.json({ error: "Could not create download URL." }, { status: 500 });
  }
}
