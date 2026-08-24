"use client";

import React from "react";
import { useRouter } from "next/navigation";

import type { FirebaseBranch } from "@/types/branch";

import { useOrganization } from "@/context/organization-context";
import { useActiveChurch } from "@/context/active-church-context";
import {
  ACTIVE_BRANCH_COOKIE_NAME,
  readActiveBranchIdFromCookieValue,
} from "@/lib/branch-cookies";

type ActiveBranchContextValue = {
  branches: FirebaseBranch[];
  activeBranch: FirebaseBranch | null;
  activeBranchId: string | null;
  showBranchSwitcher: boolean;
  setActiveBranchId: (branchId: string) => void;
};

const ActiveBranchContext =
  React.createContext<ActiveBranchContextValue | null>(null);

function persistActiveBranchCookie(branchId: string) {
  document.cookie = `${ACTIVE_BRANCH_COOKIE_NAME}=${encodeURIComponent(branchId)}; path=/; max-age=31536000; samesite=lax`;
}

export function ActiveBranchProvider({ children }: React.PropsWithChildren) {
  const router = useRouter();
  const { activeChurchId } = useActiveChurch();
  const { branchesByChurch } = useOrganization();

  const branches = React.useMemo(() => {
    if (!activeChurchId) return [];
    return (branchesByChurch[activeChurchId] ?? []).filter((b) => b.isActive);
  }, [activeChurchId, branchesByChurch]);

  const defaultBranch = React.useMemo(
    () => branches.find((b) => b.isDefault) ?? branches[0] ?? null,
    [branches]
  );

  const [activeBranchId, setActiveBranchIdState] = React.useState<string | null>(
    () => {
      if (typeof document !== "undefined") {
        const match = document.cookie
          .split("; ")
          .find((row) => row.startsWith(`${ACTIVE_BRANCH_COOKIE_NAME}=`));
        const cookieVal = match?.split("=")[1];
        const fromCookie = readActiveBranchIdFromCookieValue(cookieVal);
        if (fromCookie && branches.some((b) => b.id === fromCookie)) {
          return fromCookie;
        }
      }
      return defaultBranch?.id ?? null;
    }
  );

  React.useEffect(() => {
    if (!branches.length) {
      setActiveBranchIdState(null);
      return;
    }

    if (activeBranchId && branches.some((b) => b.id === activeBranchId)) {
      return;
    }

    const nextId = defaultBranch?.id ?? branches[0]?.id ?? null;
    setActiveBranchIdState(nextId);
    if (nextId) persistActiveBranchCookie(nextId);
  }, [branches, activeBranchId, defaultBranch]);

  const activeBranch = React.useMemo(
    () => branches.find((b) => b.id === activeBranchId) ?? null,
    [branches, activeBranchId]
  );

  const setActiveBranchId = React.useCallback(
    (branchId: string) => {
      setActiveBranchIdState(branchId);
      persistActiveBranchCookie(branchId);
      router.refresh();
    },
    [router]
  );

  const showBranchSwitcher = branches.length > 1;

  const value = React.useMemo(
    (): ActiveBranchContextValue => ({
      branches,
      activeBranch,
      activeBranchId,
      showBranchSwitcher,
      setActiveBranchId,
    }),
    [branches, activeBranch, activeBranchId, showBranchSwitcher, setActiveBranchId]
  );

  return (
    <ActiveBranchContext.Provider value={value}>
      {children}
    </ActiveBranchContext.Provider>
  );
}

export function useActiveBranch() {
  const context = React.useContext(ActiveBranchContext);
  if (!context) {
    throw new Error("useActiveBranch must be used within ActiveBranchProvider");
  }
  return context;
}

export function useActiveBranchOptional() {
  return React.useContext(ActiveBranchContext);
}

export function useRequiredActiveBranchId(): string | null {
  const { activeBranchId } = useActiveBranch();
  return activeBranchId;
}
