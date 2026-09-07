"use client";

import { useActiveChurch } from "@/context/active-church-context";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useOrganizationOptional } from "@/context/organization-context";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";
import { resolveEffectiveChurchId } from "@/lib/organization/resolve-effective-church";

/**
 * Effective church scope for workspace content queries.
 * Uses profile church pointer (Firestore) — not legacy churchRole fields.
 */
export function useAdminChurchId(): string | null {
  const { profile } = useFirebaseAuth();
  const { activeChurchId } = useActiveChurch();
  const organization = useOrganizationOptional();

  const resolved = resolveEffectiveChurchId({
    profile,
    activeChurchId,
    orgChurches: organization?.churches,
  });

  if (isPlatformSuperAdmin(profile?.platformRole)) {
    return resolved || null;
  }

  return resolved || null;
}

export function useIsPlatformSuperAdmin(): boolean {
  const { profile } = useFirebaseAuth();
  return isPlatformSuperAdmin(profile?.platformRole);
}
