"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useFirebaseAuth } from "@/context/firebase-auth-context";

const WELCOME_SESSION_KEY = "fc_pending_welcome";

function welcomeStorageKey(userId: string) {
  return `welcomeShown_${userId}`;
}

export function WelcomeMemberBanner() {
  const { authUser, profile } = useFirebaseAuth();
  const [churchName, setChurchName] = useState<string | null>(null);

  useEffect(() => {
    if (!authUser?.uid || typeof window === "undefined") return;

    const storageKey = welcomeStorageKey(authUser.uid);
    if (localStorage.getItem(storageKey) === "true") {
      sessionStorage.removeItem(WELCOME_SESSION_KEY);
      return;
    }

    const pendingWelcome = sessionStorage.getItem(WELCOME_SESSION_KEY);
    if (pendingWelcome) {
      setChurchName(pendingWelcome);
      return;
    }

    if (
      profile?.activeBranchId?.trim() &&
      !profile.pendingBranchId?.trim() &&
      profile.churchId?.trim()
    ) {
      setChurchName(null);
    }
  }, [authUser?.uid, profile?.activeBranchId, profile?.pendingBranchId, profile?.churchId]);

  if (!authUser?.uid || !churchName) {
    return null;
  }

  function handleDismiss() {
    if (!authUser?.uid) return;
    localStorage.setItem(welcomeStorageKey(authUser.uid), "true");
    sessionStorage.removeItem(WELCOME_SESSION_KEY);
    setChurchName(null);
  }

  return (
    <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-foreground">
            Welcome to {churchName}!
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            You are now a member. Explore sermons, songs, and events.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          aria-label="Dismiss welcome message"
          onClick={handleDismiss}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
