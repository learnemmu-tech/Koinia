/**
 * Server-side timing for auth/perf audits.
 * Logs only outside production so production logs stay quiet.
 */
const PERF_ENABLED = process.env.NODE_ENV !== "production";

export async function timed<T>(
  label: string,
  operation: () => Promise<T>
): Promise<T> {
  if (!PERF_ENABLED) {
    return operation();
  }

  const started = Date.now();
  try {
    return await operation();
  } finally {
    console.info(`[PERF] ${label}: ${Date.now() - started}ms`);
  }
}

export function createRequestTimer(routeLabel: string) {
  const started = Date.now();
  const marks: Record<string, number> = {};
  let last = started;

  return {
    mark(name: string) {
      if (!PERF_ENABLED) return;
      const now = Date.now();
      marks[name] = now - last;
      last = now;
    },
    finish(extra?: Record<string, number | string>) {
      if (!PERF_ENABLED) {
        return { totalMs: Date.now() - started };
      }
      marks.totalMs = Date.now() - started;
      console.info(`[PERF] ${routeLabel}.breakdown`, { ...marks, ...extra });
      return marks;
    },
  };
}
