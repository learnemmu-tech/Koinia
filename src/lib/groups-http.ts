import { NextResponse } from "next/server";

import { GroupAccessError } from "@/lib/postgres/groups";

export function groupErrorResponse(error: unknown) {
  if (error instanceof GroupAccessError) {
    const status =
      error.code === "forbidden" ? 403
      : error.code === "not_found" ? 404
      :       error.code === "already_member" || error.code === "invitation_pending" ?
        409
      : error.code === "not_church_member" || error.code === "owner_protected" ? 403
      : 400;
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status }
    );
  }
  console.error("[api/groups]", error);
  return NextResponse.json({ error: "Request failed." }, { status: 500 });
}
