import { NextResponse } from "next/server";

import { getActiveChurchesCached } from "@/lib/cached-church-data";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import { MULTI_CHURCH_ENABLED } from "@/lib/feature-flags";
import { getOrganizationSnapshot } from "@/lib/organization/organization-server";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import { timed } from "@/lib/perf";

/**
 * Active churches for the authenticated caller's tenant only.
 * Never returns a global unauthenticated church directory.
 */
export async function GET(request: Request) {
  const decoded = await verifyBearerToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Single-church product mode: clients already use organization snapshot /
  // cookies — do not expose a global church list.
  if (!MULTI_CHURCH_ENABLED) {
    return NextResponse.json({ churches: [] });
  }

  try {
    const appUser = await getAppUserByClerkId(decoded.uid);
    if (isPlatformSuperAdmin(appUser?.platformRole)) {
      const churches = await timed("churches.active", () =>
        getActiveChurchesCached()
      );
      return NextResponse.json({ churches });
    }

    const organizationId = appUser?.organizationId?.trim();
    if (!organizationId) {
      return NextResponse.json({ churches: [] });
    }

    const snapshot = await timed("churches.active.org", () =>
      getOrganizationSnapshot(organizationId, decoded.uid)
    );
    return NextResponse.json({ churches: snapshot?.churches ?? [] });
  } catch (error) {
    console.error("[api/churches/active]", error);
    return NextResponse.json(
      { error: "Failed to load churches" },
      { status: 500 }
    );
  }
}
