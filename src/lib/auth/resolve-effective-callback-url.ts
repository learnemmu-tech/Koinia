import "server-only";

import { parseJoinSlugFromPath } from "@/lib/auth/auth-paths";
import { getValidatedJoinIntentPath } from "@/lib/auth/join-intent-cookie";
import { sanitizeCallbackUrl } from "@/lib/callback-url";

/**
 * Prefer an explicit callback URL, then a validated join-intent cookie backup.
 */
export async function resolveEffectiveCallbackUrl(
  callbackUrl?: string | null
): Promise<string> {
  const sanitized = callbackUrl
    ? sanitizeCallbackUrl(callbackUrl, "")
    : "";

  if (parseJoinSlugFromPath(sanitized)) {
    return sanitized;
  }

  const joinPath = await getValidatedJoinIntentPath();
  if (joinPath) {
    return joinPath;
  }

  return sanitized;
}
