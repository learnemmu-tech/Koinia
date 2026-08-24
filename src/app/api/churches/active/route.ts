import { NextResponse } from "next/server";

import { getActiveChurchesCached } from "@/lib/cached-church-data";

export async function GET() {
  const churches = await getActiveChurchesCached();
  return NextResponse.json({ churches });
}
