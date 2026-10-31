import { timingSafeEqual } from "crypto";

import { NextResponse } from "next/server";

import { purgeExpiredConnectionAudits } from "@/lib/audit/record-client-connection";
import { processTrialLifecycle } from "@/lib/subscription/trial-lifecycle-server";

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
  const authorization = request.headers.get("authorization");
  if (!secret || !authorizedCron(secret, authorization)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const lifecycle = await processTrialLifecycle();
    const purgedConnectionAudits = await purgeExpiredConnectionAudits();
    return NextResponse.json({ ...lifecycle, purgedConnectionAudits });
  } catch (error) {
    console.error(
      "[cron/trial-lifecycle]",
      error instanceof Error ? error.message : "processing failed"
    );
    return NextResponse.json(
      { error: "Trial lifecycle processing failed." },
      { status: 500 }
    );
  }
}