import "server-only";

import { NextResponse } from "next/server";

import {
  verifyBearerToken,
  type VerifiedAuthUser,
} from "@/lib/email/verify-auth";

/**
 * Shared session boundary for route handlers.
 * Routes still apply their own role and church checks after this returns.
 * Middleware does not authenticate /api, so every private route must call
 * this helper or verifyBearerToken / requireBillingAdmin directly.
 */
export async function requireApiUser(
  request: Request
): Promise<VerifiedAuthUser | NextResponse> {
  const user = await verifyBearerToken(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
}

export function isApiAuthFailure(
  result: VerifiedAuthUser | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
