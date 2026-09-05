export async function timed<T>(
  label: string,
  operation: () => Promise<T>
): Promise<T> {
  const started = Date.now();
  try {
    return await operation();
  } finally {
    console.info(`[PERF] ${label}: ${Date.now() - started}ms`);
  }
}
