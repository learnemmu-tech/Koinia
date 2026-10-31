import "server-only";

import { headers } from "next/headers";

import { logNavStage, traceNavStage } from "@/lib/nav-trace";

export async function readNavTraceId(): Promise<string> {
  try {
    return (await headers()).get("x-fch-trace") || "no-trace";
  } catch {
    return "no-trace";
  }
}

export async function traceRequestStage<T>(
  stage: string,
  operation: () => Promise<T>,
  fields?: Record<string, string | number | boolean>
): Promise<T> {
  const traceId = await readNavTraceId();
  return traceNavStage(traceId, stage, operation, fields);
}

export async function logRequestStage(
  stage: string,
  startedAt: number,
  fields?: Record<string, string | number | boolean>
): Promise<void> {
  logNavStage(await readNavTraceId(), stage, startedAt, fields);
}
