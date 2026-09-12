import { NextResponse } from "next/server";

import { verifyBearerToken } from "@/lib/email/verify-auth";
import { resolveShepherdUserContext } from "@/lib/shepherd/resolve-context";

export async function GET(request: Request) {
  const authUser = await verifyBearerToken(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const context = await resolveShepherdUserContext(
    authUser.uid,
    authUser.email
  );
  if (!context) {
    return NextResponse.json({ error: "Profile not found." }, { status: 403 });
  }

  return NextResponse.json({
    mode: context.mode,
    displayName: context.displayName,
    isOrganizationAdmin: context.isOrganizationAdmin,
    isChurchAdmin: context.isChurchAdmin,
  });
}
