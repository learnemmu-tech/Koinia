import "server-only";

import {
  choosePostAuthCallback,
  isCreateWorkspacePath,
} from "@/lib/auth/auth-paths";
import { getValidatedJoinIntentPath } from "@/lib/auth/join-intent-cookie";
import { sanitizeCallbackUrl } from "@/lib/callback-url";

/**
 * Resolve the post-auth callback with join-church vs create-organization intent.
 *
 * A callback that names a church (`/join/{slug}`, `/c/{slug}`, or an invite)
 * always wins. A leftover join-intent cookie is used only when the callback
 * is generic. CREATE_ORGANIZATION wins when the callback is `/onboarding`.
 */
export async function resolveEffectiveCallbackUrl(
  callbackUrl?: string | null
): Promise<string> {
  const sanitized = callbackUrl
    ? sanitizeCallbackUrl(callbackUrl, "")
    : "";

  const joinPath = await getValidatedJoinIntentPath();

  return choosePostAuthCallback(
    sanitized,
    joinPath,
    isCreateWorkspacePath(sanitized, sanitizeCallbackUrl)
  );
}
