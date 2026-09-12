import { sanitizeCallbackUrl } from "@/lib/callback-url";
import { resolvePostAuthDestination } from "@/lib/auth/resolve-post-auth-destination";
import {
  firebaseAuth,
  getUserProfile,
  type FirestoreUser,
} from "@/lib/firebase-auth-service";
import type { MembershipRoutingResult } from "@/lib/auth/membership-routing";

export type CompletePostAuthResult = {
  profile: FirestoreUser;
  destination: string;
  routing: MembershipRoutingResult;
};

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

/**
 * One round-trip: sync profile + resolve post-auth destination.
 */
export async function completePostAuthSession(options?: {
  firstName?: string;
  lastName?: string;
  callbackUrl?: string;
}): Promise<CompletePostAuthResult> {
  const user = firebaseAuth.currentUser;
  if (!user) {
    throw new Error("Signed in but user is unavailable.");
  }

  const redirectTo = sanitizeCallbackUrl(options?.callbackUrl ?? "/");
  const token = await user.getIdToken();
  const response = await fetch("/api/auth/complete-session", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      email: user.email,
      firstName: options?.firstName,
      lastName: options?.lastName,
      callbackUrl: redirectTo,
    }),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(
      error?.error ?? `Failed to complete sign-in (${response.status}).`
    );
  }

  const data = (await response.json()) as {
    profile: FirestoreUser;
    routing: MembershipRoutingResult;
    destination: string;
  };

  return {
    profile: data.profile,
    routing: data.routing,
    destination: data.destination || redirectTo,
  };
}
