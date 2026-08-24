import type { FirestoreUser } from "@/lib/firebase-auth-service";
import type { FirebaseMembership } from "@/types/membership";

import {
  resolvePostAuthDestination as resolvePostAuthDestinationInternal,
  type PostAuthInput,
} from "./auth-flow";

export type PostAuthDestinationInput = {
  profile: FirestoreUser | null;
  membership?: FirebaseMembership | null;
  churchesCount?: number;
  branchesCount?: number;
  workspaceType?: PostAuthInput["workspaceType"];
  callbackUrl?: string | null;
};

/**
 * Single source of truth for post-login/signup redirects (Firestore-backed profile).
 */
export function resolvePostAuthDestination(
  input: PostAuthDestinationInput
): string {
  return resolvePostAuthDestinationInternal(input);
}

export function resolveAuthenticatedAuthPageDestination(
  profile: FirestoreUser | null,
  callbackUrl?: string | null,
  membership?: FirebaseMembership | null,
  churchesCount?: number
): string {
  return resolvePostAuthDestination({
    profile,
    membership,
    churchesCount,
    callbackUrl,
  });
}
