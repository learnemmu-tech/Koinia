import { timingSafeEqual } from "crypto";

import { NextResponse } from "next/server";

import { cleanupAbandonedUploads } from "@/lib/storage/stored-objects";

function authorizedCron(secret: string, authorization: string | null): boolean {
  if (!authorization) return false;
  const expected = `Bearer ${secret}`;
  const left = Buffer.from(authorization);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || !authorizedCron(secret, request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const removed = await cleanupAbandonedUploads();
    return NextResponse.json({ removed });
  } catch (error) {
    console.error(
      "[cron/stored-objects]",
      error instanceof Error ? error.message : "cleanup failed"
    );
    return NextResponse.json({ error: "Cleanup failed." }, { status: 500 });
  }
}
