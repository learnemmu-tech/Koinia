import { NextResponse } from "next/server";

import { GroupChatError } from "@/lib/postgres/group-chat";

export function groupChatErrorResponse(error: unknown) {
  if (error instanceof GroupChatError) {
    const status =
      error.code === "forbidden" ? 403
      : error.code === "not_found" ? 404
      : 400;
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status }
    );
  }
  console.error("[api/groups/messages]", error);
  return NextResponse.json({ error: "Request failed." }, { status: 500 });
}
