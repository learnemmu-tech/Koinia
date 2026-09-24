"use client";

import { useEffect, useState } from "react";

import { TrialExpiredSessionDialog } from "@/components/subscription/trial-expired-dialogs";
import { useOrganizationOptional } from "@/context/organization-context";
import { useSubscriptionOptional } from "@/context/subscription-context";
import { isTrialAccessExpired } from "@/lib/subscription/trial-write";
import { roleMeetsMinimum } from "@/types/membership";

const STORAGE_PREFIX = "fch-trial-expired-modal:";

function sessionKey(organizationId: string) {
  return `${STORAGE_PREFIX}${organizationId}`;
}

export function TrialExpiredDialog() {
  const subscription = useSubscriptionOptional();
  const organization = useOrganizationOptional();
  const organizationId = organization?.organization?.id ?? subscription?.organizationId;
  const membership = organization?.membership;
  const trial = subscription?.snapshot?.trial;
  const canManageBilling =
    membership?.status === "active" &&
    roleMeetsMinimum(membership.role, "org_admin");

  const expired = isTrialAccessExpired(trial);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!expired || !canManageBilling || !organizationId) {
      setOpen(false);
      return;
    }
    try {
      if (sessionStorage.getItem(sessionKey(organizationId)) === "1") {
        setOpen(false);
        return;
      }
    } catch {
      // sessionStorage may be unavailable; still show once this mount.
    }
    setOpen(true);
  }, [expired, canManageBilling, organizationId]);

  function dismiss() {
    if (organizationId) {
      try {
        sessionStorage.setItem(sessionKey(organizationId), "1");
      } catch {
        // Ignore storage failures; access restrictions remain server-side.
      }
    }
    setOpen(false);
  }

  if (!expired || !canManageBilling) return null;

  return <TrialExpiredSessionDialog open={open} onOpenChange={(next) => {
    if (!next) dismiss();
  }} />;
}
