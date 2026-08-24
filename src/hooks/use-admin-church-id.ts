"use client";

import { useActiveChurch } from "@/context/active-church-context";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useOrganizationOptional } from "@/context/organization-context";
import { isPlatformSuperAdmin } from "@/lib/church-access";
import { getLegacyDefaultChurchId } from "@/lib/church-scope";
import { resolveEffectiveChurchId } from "@/lib/organization/resolve-effective-church";

/**
 * Effective church scope for workspace content queries.
 * Uses profile church pointer (Firestore) — not legacy churchRole fields.
 */
export function useAdminChurchId(): string | null {
  const { authUser, profile } = useFirebaseAuth();
  const { activeChurchId } = useActiveChurch();
  const organization = useOrganizationOptional();

  const resolved = resolveEffectiveChurchId({
    profile,
    activeChurchId,
    orgChurches: organization?.churches,
  });

  if (isPlatformSuperAdmin(authUser?.email)) {
    return resolved || getLegacyDefaultChurchId() || null;
  }

  return resolved || null;
}

export function useIsPlatformSuperAdmin(): boolean {
  const { authUser } = useFirebaseAuth();
  return isPlatformSuperAdmin(authUser?.email);
}
