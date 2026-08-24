"use client";

import React from "react";

import type { FirebaseChurch } from "@/types/firebase-church";

import {
  ACTIVE_CHURCH_COOKIE_NAME,
  readActiveChurchIdFromCookieValue,
} from "@/lib/church-cookies";
import { getLegacyDefaultChurchId } from "@/lib/church-scope";
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

function persistActiveChurchCookie(churchId: string) {
  document.cookie = `${ACTIVE_CHURCH_COOKIE_NAME}=${encodeURIComponent(churchId)}; path=/; max-age=31536000; samesite=lax`;
}

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
    () => {
      const cookieId = readActiveChurchIdFromCookieValue(initialActiveChurchId);
      if (cookieId) return cookieId;

      const firstActive = initialChurches.find((church) => church.isActive);
      if (firstActive) return firstActive.id;

      return getLegacyDefaultChurchId() || null;
    }
  );
  const [isLoading, setIsLoading] = React.useState(() => {
    if (!MULTI_CHURCH_ENABLED) return false;

    const cookieId = readActiveChurchIdFromCookieValue(initialActiveChurchId);
    if (cookieId) return false;
    if (initialChurches.some((church) => church.isActive)) return false;
    if (getLegacyDefaultChurchId()) return false;
    return true;
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
    if (!MULTI_CHURCH_ENABLED) {
      if (initialChurches.length === 0) {
        void refreshChurches();
      } else {
        setIsLoading(false);
      }
      return;
    }

    void refreshChurches();
  }, [refreshChurches, initialChurches.length]);

  React.useEffect(() => {
    if (!MULTI_CHURCH_ENABLED) return;

    if (activeChurchId) return;

    const legacyId = getLegacyDefaultChurchId();
    if (legacyId) {
      setActiveChurchIdState(legacyId);
      return;
    }

    const firstActive = churches.find((church) => church.isActive);
    if (firstActive) {
      setActiveChurchIdState(firstActive.id);
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
  const legacyId = getLegacyDefaultChurchId();

  return React.useMemo(() => {
    const profileChurchId = profile?.churchId?.trim() || "";
    const resolved =
      profileChurchId || activeChurchId?.trim() || legacyId || "";

    if (!MULTI_CHURCH_ENABLED) {
      return {
        churchId: resolved,
        isLoading: (authLoading || isLoading) && !resolved,
      };
    }

    return {
      churchId: activeChurchId || legacyId || "",
      isLoading: isLoading && !(activeChurchId || legacyId),
    };
  }, [
    activeChurchId,
    isLoading,
    legacyId,
    profile?.churchId,
    authLoading,
  ]);
}

export function useRequiredActiveChurchId(): string {
  return useActiveChurchScope().churchId;
}
