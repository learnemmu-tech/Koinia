"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock3, Loader2 } from "lucide-react";

import { AuthLoading } from "@/components/auth/auth-loading";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { ACCESS_DENIED_PATH } from "@/lib/auth/auth-paths";
import { firebaseAuth } from "@/lib/firebase-auth-service";

type PendingJoinStatus = {
  churchName: string;
  slug: string;
  branchId: string;
  status: "pending" | "active";
};

const REDIRECT_SECONDS = 3;
const WELCOME_SESSION_KEY = "fc_pending_welcome";
const MEMBER_HOME = "/";

export function WaitingApprovalClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { authUser, loading: authLoading, refreshProfile } = useFirebaseAuth();
  const [pending, setPending] = useState<PendingJoinStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);
  const redirectStartedRef = useRef(false);
  const navigatedRef = useRef(false);

  const handleApproved = useCallback(
    (churchName: string) => {
      if (redirectStartedRef.current) return;
      redirectStartedRef.current = true;

      setPending((current) =>
        current
          ? { ...current, churchName, status: "active" }
          : { churchName, slug: "", branchId: "", status: "active" }
      );
      setIsApproved(true);
      setCountdown(REDIRECT_SECONDS);

      if (typeof window !== "undefined") {
        sessionStorage.setItem(WELCOME_SESSION_KEY, churchName);
      }

      void (async () => {
        await refreshProfile();
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["organization"] }),
          queryClient.invalidateQueries({ queryKey: ["membership-routing"] }),
        ]);
      })();
    },
    [queryClient, refreshProfile]
  );

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.replace("/signin");
    }
  }, [authUser, authLoading, router]);

  useEffect(() => {
    async function loadPending() {
      const user = firebaseAuth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/join/pending", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setPending(null);
          return;
        }
        const data = (await res.json()) as { pending: PendingJoinStatus | null };
        if (data.pending) {
          setPending(data.pending);
          if (data.pending.status === "active") {
            handleApproved(data.pending.churchName);
          }
          return;
        }

        const profile = await refreshProfile();
        if (profile?.activeBranchId?.trim() && !profile.pendingBranchId?.trim()) {
          router.replace(MEMBER_HOME);
          return;
        }

        setPending(null);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && authUser) {
      void loadPending();
    }
  }, [authUser, authLoading, handleApproved, refreshProfile, router]);

  useEffect(() => {
    const user = firebaseAuth.currentUser;
    if (!user || !pending?.branchId || isApproved) return;

    let cancelled = false;
    const tick = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/join/pending", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { pending: PendingJoinStatus | null };
        if (data.pending?.status === "active") {
          handleApproved(data.pending.churchName);
          return;
        }
        if (!data.pending) {
          const profile = await refreshProfile();
          if (profile?.activeBranchId?.trim() && !profile.pendingBranchId?.trim()) {
            handleApproved(pending.churchName);
            return;
          }
          router.replace(ACCESS_DENIED_PATH);
        }
      } catch {
        // Keep polling.
      }
    };

    void tick();
    const interval = window.setInterval(() => {
      void tick();
    }, 4000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [pending, isApproved, handleApproved, refreshProfile, router]);

  useEffect(() => {
    if (!isApproved) return;

    const interval = window.setInterval(() => {
      setCountdown((value) => {
        if (value <= 1) {
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isApproved]);

  useEffect(() => {
    if (!isApproved || countdown > 0 || navigatedRef.current) return;
    navigatedRef.current = true;
    router.replace(MEMBER_HOME);
  }, [isApproved, countdown, router]);

  if (authLoading || loading) return <AuthLoading />;
  if (!authUser) return <AuthLoading />;

  if (isApproved && pending) {
    const progress = ((REDIRECT_SECONDS - countdown) / REDIRECT_SECONDS) * 100;

    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-12 text-center">
        <div className="animate-in zoom-in-50 fade-in duration-500">
          <CheckCircle2 className="size-20 text-foreground" aria-hidden />
        </div>
        <h1 className="mt-6 font-heading text-2xl font-bold">
          You have been approved!
        </h1>
        <p className="mt-4 text-muted-foreground">
          Welcome to{" "}
          <span className="font-medium text-foreground">{pending.churchName}</span>.
          You now have full access to the church community.
        </p>
        <div className="mt-8 w-full max-w-xs space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground">
            Redirecting you in {countdown} second{countdown === 1 ? "" : "s"}...
          </p>
        </div>
      </div>
    );
  }

  if (!pending) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-12 text-center">
        <h1 className="font-heading text-2xl font-bold">No pending request</h1>
        <p className="mt-3 text-muted-foreground">
          You don&apos;t have a church membership request awaiting approval.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Go to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-12 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
        <Clock3 className="size-8" />
      </div>
      <h1 className="mt-6 font-heading text-2xl font-bold">Waiting for approval</h1>
      <p className="mt-4 text-muted-foreground">
        Your request has been sent to{" "}
        <span className="font-medium text-foreground">{pending.churchName}</span>.
        Please wait until a church administrator approves your membership.
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        This page updates automatically when your request is approved.
      </p>
      <div className="mt-6 inline-flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        Listening for approval...
      </div>
      <Button asChild variant="outline" className="mt-8">
        <Link href="/">Go to Home</Link>
      </Button>
    </div>
  );
}
