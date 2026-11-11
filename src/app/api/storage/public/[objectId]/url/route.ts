import { NextResponse } from "next/server";

import { isPostgresUuid } from "@/lib/postgres/uuid";
import {
  StoredObjectError,
  presignObjectKey,
  readReadyObjectAccess,
} from "@/lib/storage/stored-objects";

export async function GET(
  _request: Request,
  context: { params: Promise<{ objectId: string }> }
) {
  try {
    const { objectId } = await context.params;
    if (!isPostgresUuid(objectId)) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    const row = await readReadyObjectAccess(objectId);
    if (row.visibility !== "public_read" || !row.published) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    const signed = await presignObjectKey(row.objectKey);
    return NextResponse.json(signed);
  } catch (error) {
    if (error instanceof StoredObjectError) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    console.error("[storage/public-url]", error instanceof Error ? error.message : "failed");
    return NextResponse.json({ error: "Could not create download URL." }, { status: 500 });
  }
}
