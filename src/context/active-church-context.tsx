"use client";

import React from "react";

import type { FirebaseChurch } from "@/types/firebase-church";

import {
  persistActiveChurchCookie,
  readActiveChurchIdFromCookieValue,
} from "@/lib/church-cookies";
import { MULTI_CHURCH_ENABLED } from "@/lib/feature-flags";
import { useFirebaseAuth } from "@/context/firebase-auth-context";

type ActiveChurchContextValue = {
  churches: FirebaseChurch[];
  activeChurch: FirebaseChurch | null;
  activeChurchId: string | null;
  isLoading: boolean;
  setActiveChurchId: (churchId: string) => void;
  refreshChurches: () => Promise<void>;
};

const ActiveChurchContext =
  React.createContext<ActiveChurchContextValue | null>(null);

type ActiveChurchProviderProps = React.PropsWithChildren<{
  initialChurches: FirebaseChurch[];
  initialActiveChurchId?: string | null;
}>;

export function ActiveChurchProvider({
  children,
  initialChurches,
  initialActiveChurchId = null,
}: ActiveChurchProviderProps) {
  const [churches, setChurches] = React.useState(initialChurches);
  const [activeChurchId, setActiveChurchIdState] = React.useState<string | null>(
    () => readActiveChurchIdFromCookieValue(initialActiveChurchId)
  );
  const [isLoading, setIsLoading] = React.useState(() => {
    if (!MULTI_CHURCH_ENABLED) return false;
    return !readActiveChurchIdFromCookieValue(initialActiveChurchId);
  });

  const activeChurch = React.useMemo(
    () => churches.find((church) => church.id === activeChurchId) ?? null,
    [churches, activeChurchId]
  );

  React.useEffect(() => {
    if (activeChurchId) {
      persistActiveChurchCookie(activeChurchId);
    }
  }, [activeChurchId]);

  const setActiveChurchId = React.useCallback((churchId: string) => {
    setActiveChurchIdState(churchId);
    persistActiveChurchCookie(churchId);
  }, []);

  const refreshChurches = React.useCallback(async () => {
    try {
      const response = await fetch("/api/churches/active");
      if (!response.ok) return;
      const data = (await response.json()) as { churches?: FirebaseChurch[] };
      if (Array.isArray(data.churches)) {
        setChurches(data.churches);
      }
    } catch {
      // Non-blocking refresh
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // Multi-church is off: active church comes from cookies/profile. Do not
    // hit /api/churches/active on every session — it races the auth bootstrap
    // stampede for no UI benefit.
    if (!MULTI_CHURCH_ENABLED) {
      setIsLoading(false);
      return;
    }

    void refreshChurches();
  }, [refreshChurches]);

  React.useEffect(() => {
    if (!MULTI_CHURCH_ENABLED) return;
    if (activeChurchId) return;

    const accessible = churches.filter((church) => church.isActive);
    if (accessible.length === 1) {
      setActiveChurchIdState(accessible[0]!.id);
    }
  }, [churches, activeChurchId]);

  const value = React.useMemo(
    () => ({
      churches,
      activeChurch,
      activeChurchId,
      isLoading,
      setActiveChurchId,
      refreshChurches,
    }),
    [
      churches,
      activeChurch,
      activeChurchId,
      isLoading,
      setActiveChurchId,
      refreshChurches,
    ]
  );

  return (
    <ActiveChurchContext.Provider value={value}>
      {children}
    </ActiveChurchContext.Provider>
  );
}

export function useActiveChurch(): ActiveChurchContextValue {
  const context = React.useContext(ActiveChurchContext);
  if (!context) {
    throw new Error("useActiveChurch must be used within ActiveChurchProvider");
  }
  return context;
}

export function useActiveChurchScope(): {
  churchId: string;
  isLoading: boolean;
} {
  const { activeChurchId, isLoading } = useActiveChurch();
  const { profile, loading: authLoading } = useFirebaseAuth();

  return React.useMemo(() => {
    const profileChurchId = profile?.churchId?.trim() || "";
    const resolved = profileChurchId || activeChurchId?.trim() || "";

    if (!MULTI_CHURCH_ENABLED) {
      return {
        churchId: resolved,
        isLoading: (authLoading || isLoading) && !resolved,
      };
    }

    return {
      churchId: resolved,
      isLoading: isLoading && !resolved,
    };
  }, [
    activeChurchId,
    isLoading,
    profile?.churchId,
    authLoading,
  ]);
}

export function useRequiredActiveChurchId(): string {
  return useActiveChurchScope().churchId;
}
