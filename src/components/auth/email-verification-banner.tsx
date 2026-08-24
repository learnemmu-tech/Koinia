"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MailWarning, X } from "lucide-react";
import { toast } from "sonner";
import { sendEmailVerification, type User } from "firebase/auth";

import { Button } from "@/components/ui/button";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { firebaseAuth } from "@/lib/firebase-auth-service";

function isGoogleAccount(user: User) {
  return user.providerData.some(
    (provider) => provider.providerId === "google.com"
  );
}

function isPasswordAccount(user: User) {
  return user.providerData.some(
    (provider) => provider.providerId === "password"
  );
}

export function EmailVerificationBanner() {
  const { user, loading } = useFirebaseAuth();
  const [showBanner, setShowBanner] = useState(false);
  const verifiedToastShownRef = useRef(false);

  const syncVerificationState = useCallback(async () => {
    const current = firebaseAuth.currentUser;
    if (!current) {
      setShowBanner(false);
      return;
    }

    if (isGoogleAccount(current)) {
      setShowBanner(false);
      return;
    }

    try {
      await current.reload();
    } catch {
      // Ignore reload failures; keep current state.
    }

    const refreshed = firebaseAuth.currentUser;
    if (!refreshed?.email) {
      setShowBanner(false);
      return;
    }

    if (refreshed.emailVerified) {
      setShowBanner(false);
      if (!verifiedToastShownRef.current) {
        verifiedToastShownRef.current = true;
        toast.success("Email verified successfully! Your account is now secure.", {
          duration: 4000,
        });
      }
      return;
    }

    if (isPasswordAccount(refreshed)) {
      setShowBanner(true);
    } else {
      setShowBanner(false);
    }
  }, []);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setShowBanner(false);
      return;
    }

    if (user.emailVerified || isGoogleAccount(user)) {
      setShowBanner(false);
      return;
    }

    if (isPasswordAccount(user)) {
      setShowBanner(true);
    }

    void syncVerificationState();
  }, [loading, user, syncVerificationState]);

  useEffect(() => {
    if (!user || user.emailVerified || isGoogleAccount(user)) return;

    const interval = window.setInterval(() => {
      void syncVerificationState();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [user, syncVerificationState]);

  useEffect(() => {
    if (!user || user.emailVerified || isGoogleAccount(user)) return;

    function handleFocus() {
      void syncVerificationState();
    }

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [user, syncVerificationState]);

  if (loading || !showBanner || !user?.email) {
    return null;
  }

  async function handleResend() {
    const current = firebaseAuth.currentUser;
    if (!current) return;

    try {
      await sendEmailVerification(current);
      toast.success("Verification email sent. Please check your inbox.");
    } catch {
      toast.error("Could not send verification email. Try again later.");
    }
  }

  return (
    <div
      role="status"
      className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-950 dark:text-amber-100"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:justify-between">
        <p className="inline-flex items-center gap-2 text-center sm:text-left">
          <MailWarning className="size-4 shrink-0" aria-hidden />
          Please verify your email ({user.email}) to secure your account.
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-amber-500/40 bg-background/80"
            onClick={() => void handleResend()}
          >
            Resend verification email
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-amber-900/70 hover:text-amber-950 dark:text-amber-100/70 dark:hover:text-amber-50"
            aria-label="Dismiss verification reminder"
            onClick={() => setShowBanner(false)}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
