import "server-only";

import {
  isCreateWorkspacePath,
  isInvitePath,
  parseJoinSlugFromPath,
} from "@/lib/auth/auth-paths";
import { getValidatedJoinIntentPath } from "@/lib/auth/join-intent-cookie";
import { sanitizeCallbackUrl } from "@/lib/callback-url";

/**
 * Resolve the post-auth callback with join-church vs create-organization intent.
 *
 * JOIN_CHURCH wins when the callback is `/join/{slug}` (or `/invite/{token}`).
 * CREATE_ORGANIZATION wins when the callback is explicitly `/onboarding`.
 * A leftover join-intent cookie is only used when the callback is generic
 * (empty, home, or an auth continue URL) — never when the user started
 * organization onboarding on purpose.
 */
export async function resolveEffectiveCallbackUrl(
  callbackUrl?: string | null
): Promise<string> {
  const sanitized = callbackUrl
    ? sanitizeCallbackUrl(callbackUrl, "")
    : "";

  if (parseJoinSlugFromPath(sanitized) || isInvitePath(sanitized)) {
    return sanitized;
  }

  if (isCreateWorkspacePath(sanitized, sanitizeCallbackUrl)) {
    return sanitized;
  }

  const joinPath = await getValidatedJoinIntentPath();
  if (joinPath) {
    return joinPath;
  }

  return sanitized;
}
