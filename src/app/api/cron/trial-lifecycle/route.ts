import { NextResponse } from "next/server";

import { processTrialLifecycle } from "@/lib/subscription/trial-lifecycle-server";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(await processTrialLifecycle());
  } catch (error) {
    console.error("[cron/trial-lifecycle]", error);
    return NextResponse.json(
      { error: "Trial lifecycle processing failed." },
      { status: 500 }
    );
  }
}