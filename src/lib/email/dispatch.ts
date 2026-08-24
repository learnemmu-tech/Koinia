import "server-only";

/**
 * Fire-and-forget email dispatch. Never throws — failures are logged only.
 */
export function dispatchEmail(
  label: string,
  task: () => Promise<unknown>
): void {
  void task().catch((error) => {
    console.error(`[email] ${label} failed:`, error);
  });
}
