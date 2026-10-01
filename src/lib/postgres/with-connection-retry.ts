import "server-only";

function collectErrorCodes(error: unknown): Set<string> {
  const codes = new Set<string>();
  let current: unknown = error;
  for (let i = 0; i < 4 && current && typeof current === "object"; i += 1) {
    const record = current as { code?: unknown; cause?: unknown };
    if (typeof record.code === "string") codes.add(record.code);
    current = record.cause;
  }
  return codes;
}

function collectErrorText(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let i = 0; i < 4 && current && typeof current === "object"; i += 1) {
    const record = current as { message?: unknown; cause?: unknown };
    if (typeof record.message === "string") parts.push(record.message);
    current = record.cause;
  }
  return parts.join(" ").toLowerCase();
}

export function isRetryableConnectionError(error: unknown): boolean {
  const codes = collectErrorCodes(error);
  if (
    codes.has("ECONNRESET") ||
    codes.has("ETIMEDOUT") ||
    codes.has("ECONNREFUSED") ||
    codes.has("57P01") ||
    codes.has("57P03") ||
    codes.has("08006") ||
    codes.has("08001") ||
    codes.has("08003")
  ) {
    return true;
  }

  const text = collectErrorText(error);
  return (
    text.includes("connection terminated") ||
    text.includes("connection timeout") ||
    text.includes("timeout expired") ||
    text.includes("client has encountered a connection error") ||
    text.includes("cannot acquire a connection")
  );
}

export function isUniqueViolation(error: unknown): boolean {
  return collectErrorCodes(error).has("23505");
}

/** Retry once after a dropped/idle Postgres connection. Does not add delay. */
export async function withConnectionRetry<T>(
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!isRetryableConnectionError(error)) throw error;
    return operation();
  }
}
