/**
 * Temporary navigation timings. Logs a trace id, stage, and duration only.
 * Disabled in production unless NAV_TRACE=1.
 */

const ENABLED =
  process.env.NODE_ENV !== "production" || process.env.NAV_TRACE === "1";

export function createNavTraceId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function logNavStage(
  traceId: string,
  stage: string,
  startedAt: number,
  fields?: Record<string, string | number | boolean>
): void {
  if (!ENABLED) return;
  const durationMs = Date.now() - startedAt;
  console.info(
    `[nav] ${traceId} ${stage} ${durationMs}ms`,
    fields ?? {}
  );
}

export async function traceNavStage<T>(
  traceId: string,
  stage: string,
  operation: () => Promise<T>,
  fields?: Record<string, string | number | boolean>
): Promise<T> {
  const startedAt = Date.now();
  try {
    return await operation();
  } finally {
    logNavStage(traceId, stage, startedAt, fields);
  }
}
