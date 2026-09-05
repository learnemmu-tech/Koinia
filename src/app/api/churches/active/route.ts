import { NextResponse } from "next/server";

import { getActiveChurchesCached } from "@/lib/cached-church-data";
import { timed } from "@/lib/perf";

export async function GET() {
  const churches = await timed("churches.active", () =>
    getActiveChurchesCached()
  );
  return NextResponse.json({ churches });
}
