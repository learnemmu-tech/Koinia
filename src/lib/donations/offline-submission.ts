/** Keep one offline key until the server confirms success. A new gift needs a new key. */
export function offlineSubmissionKey(existing: string, createKey: () => string): string {
  const current = existing.trim();
  return current || createKey();
}

export function offlineKeyAfterResult(key: string, succeeded: boolean): string {
  return succeeded ? "" : key;
}
