import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { storedObjects } from "@/db/schema";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import { userCanManageChurch } from "@/lib/postgres/session";
import { isPostgresUuid } from "@/lib/postgres/uuid";
import { StoredObjectError, deleteStoredObjectRecord } from "@/lib/storage/stored-objects";
import {
  assertChurchContentWritable,
  isSubscriptionLimitError,
} from "@/lib/subscription/subscription-server";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ objectId: string }> }
) {
  try {
    const decoded = await verifyBearerToken(request);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { objectId } = await context.params;
    if (!isPostgresUuid(objectId)) {
      return new NextResponse(null, { status: 204 });
    }
    const [row] = await db
      .select({ churchId: storedObjects.churchId })
      .from(storedObjects)
      .where(eq(storedObjects.id, objectId))
      .limit(1);
    if (!row) return new NextResponse(null, { status: 204 });
    const allowed = await userCanManageChurch(decoded.uid, decoded.email, row.churchId);
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await assertChurchContentWritable(row.churchId);
    const result = await deleteStoredObjectRecord(objectId);
    if (result === "retry") {
      return NextResponse.json(
        { error: "Object deletion could not be finished. Retry the request." },
        { status: 502 }
      );
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof StoredObjectError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (isSubscriptionLimitError(error)) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("[storage/delete]", error instanceof Error ? error.message : "failed");
    return NextResponse.json({ error: "Could not delete object." }, { status: 500 });
  }
}
