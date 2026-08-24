"use client";

import { useEffect, useMemo } from "react";

import { useActiveChurch } from "@/context/active-church-context";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useOrganizationOptional } from "@/context/organization-context";
import { resolveEffectiveChurchId } from "@/lib/organization/resolve-effective-church";

/** Keeps active church selection aligned with profile and organization churches. */
export function OrganizationChurchBridge() {
  const { profile } = useFirebaseAuth();
  const organization = useOrganizationOptional();
  const { activeChurchId, setActiveChurchId } = useActiveChurch();

  const activeOrgChurches = useMemo(
    () => (organization?.churches ?? []).filter((church) => church.isActive),
    [organization?.churches]
  );

  const nextChurchId = useMemo(
    () =>
      resolveEffectiveChurchId({
        profile,
        activeChurchId,
        orgChurches: activeOrgChurches,
        allowLegacyDefault: activeOrgChurches.length === 0,
      }),
    [profile, activeChurchId, activeOrgChurches]
  );

  useEffect(() => {
    if (!nextChurchId || nextChurchId === activeChurchId) return;
    setActiveChurchId(nextChurchId);
  }, [nextChurchId, activeChurchId, setActiveChurchId]);

  return null;
}
