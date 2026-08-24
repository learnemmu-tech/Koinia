import { sanitizeCallbackUrl } from "@/lib/callback-url";
import { resolvePostAuthDestination } from "@/lib/auth/resolve-post-auth-destination";
import { firebaseAuth, getUserProfile } from "@/lib/firebase-auth-service";

/**
 * Loads membership context from the server and returns the post-auth destination.
 */
export async function fetchPostAuthDestination(
  callbackUrl: string
): Promise<string> {
  const user = firebaseAuth.currentUser;
  const redirectTo = sanitizeCallbackUrl(callbackUrl);

  if (!user) {
    return redirectTo;
  }

  try {
    const token = await user.getIdToken();
    const params = new URLSearchParams({ callbackUrl: redirectTo });
    const res = await fetch(`/api/auth/routing?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const data = (await res.json()) as { destination: string };
      if (data.destination) return data.destination;
    }
  } catch {
    // Fall through to client-side profile-only routing.
  }

  const profile = await getUserProfile(user.uid);
  return resolvePostAuthDestination({ profile, callbackUrl: redirectTo });
}
