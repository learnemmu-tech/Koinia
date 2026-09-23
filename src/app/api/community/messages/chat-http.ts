import { NextResponse } from "next/server";

import { CommunityChatError } from "@/lib/postgres/community-chat";

export function communityChatErrorResponse(error: unknown) {
  if (error instanceof CommunityChatError) {
    const status =
      error.code === "forbidden" ? 403
      : error.code === "not_found" ? 404
      : 400;
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status }
    );
  }
  console.error("[api/community/messages]", error);
  return NextResponse.json({ error: "Request failed." }, { status: 500 });
}
