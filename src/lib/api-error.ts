import "server-only";

import { NextResponse } from "next/server";

/**
 * Log full error server-side; return a safe client message.
 * Never forward provider/DB/stack details to clients.
 */
export function jsonApiError(
  route: string,
  error: unknown,
  fallback: string,
  status = 500
): NextResponse {
  console.error(`[${route}]`, error);
  return NextResponse.json({ error: fallback }, { status });
}

export function safeErrorMessage(
  error: unknown,
  fallback: string
): string {
  // Intentionally ignore error.message for client responses.
  void error;
  return fallback;
}
