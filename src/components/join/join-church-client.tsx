"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Mail, MapPin, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Google } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  buildJoinAuthHref,
  WAITING_APPROVAL_PATH,
} from "@/lib/auth/auth-flow";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { setAuthCookie } from "@/context/firebase-auth-context";
import { getJoinFlowMessage } from "@/lib/enrollment";
import { getFirebaseAuthErrorMessage } from "@/lib/firebase-auth-errors";
import { firebaseAuth, signInWithGoogle } from "@/lib/firebase-auth-service";
import { DEFAULT_CHURCH_LOGO } from "@/lib/organization/onboarding-constants";
import type { EnrollmentMode } from "@/types/enrollment";
import { cn } from "@/lib/utils";

type JoinChurchPreview = {
  name: string;
  slug: string;
  country?: string;
  logoUrl?: string;
  welcomeMessage?: string;
  enrollmentMode: EnrollmentMode;
  joinAvailable: boolean;
  joinBlockedReason?: string;
  slugStatus?: "active" | "retired";
};

type JoinChurchClientProps = {
  slug: string;
};

export function JoinChurchClient({ slug }: JoinChurchClientProps) {
  const router = useRouter();
  const { authUser, loading: authLoading, refreshProfile } = useFirebaseAuth();
  const [church, setChurch] = useState<JoinChurchPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const joinAttemptedRef = useRef(false);

  useEffect(() => {
    async function loadChurch() {
      try {
        const res = await fetch(`/api/join/${encodeURIComponent(slug)}`);
        if (!res.ok) {
          setChurch(null);
          return;
        }
        const data = (await res.json()) as JoinChurchPreview;
        setChurch(data);
      } finally {
        setLoading(false);
      }
    }
    void loadChurch();
  }, [slug]);

  const submitJoinRequest = useCallback(async () => {
    const user = firebaseAuth.currentUser;
    if (!user) return false;

    setJoining(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/join/${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Failed to join");
      }
      const data = (await res.json()) as {
        churchName: string;
        status: "active" | "pending";
      };
      await refreshProfile();

      if (data.status === "active") {
        router.replace("/dashboard");
      } else {
        router.replace(WAITING_APPROVAL_PATH);
      }
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to join church");
      return false;
    } finally {
      setJoining(false);
    }
  }, [slug, refreshProfile, router]);

  useEffect(() => {
    if (
      loading ||
      authLoading ||
      !church ||
      !church.joinAvailable ||
      !authUser ||
      joinAttemptedRef.current
    ) {
      return;
    }

    joinAttemptedRef.current = true;
    void submitJoinRequest();
  }, [loading, authLoading, church, authUser, submitJoinRequest]);

  async function handleGoogleContinue() {
    setGoogleLoading(true);
    try {
      const googleResult = await signInWithGoogle();
      if ("redirected" in googleResult) return;

      const { profile } = googleResult;
      setAuthCookie(true, { role: profile.role, profile });
      joinAttemptedRef.current = false;
    } catch (error) {
      toast.error(getFirebaseAuthErrorMessage(error));
    } finally {
      setGoogleLoading(false);
    }
  }

  if (loading || authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!church) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-heading text-2xl font-bold">Church not found</h1>
        <p className="mt-2 text-muted-foreground">
          This join link may be invalid or the church is no longer active.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    );
  }

  if (church.slugStatus === "retired") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-heading text-2xl font-bold">Link no longer valid</h1>
        <p className="mt-4 text-muted-foreground">
          This invitation link is no longer valid. Please contact your church
          administrator for a new invitation.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    );
  }

  const logo = church.logoUrl?.trim() || DEFAULT_CHURCH_LOGO;
  const welcome =
    church.welcomeMessage?.trim() ||
    "Join our church community on FaithConnectHub.";
  const joinBlocked = !church.joinAvailable;
  const flowMessage = getJoinFlowMessage(church.enrollmentMode);

  return (
    <div className="relative flex min-h-svh items-center justify-center px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background"
        aria-hidden
      />

      <div className="relative w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-lg">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary/30 via-primary to-primary/30" />

          <div className="p-8 text-center">
            <div className="mx-auto mb-5 flex size-24 items-center justify-center overflow-hidden rounded-2xl border border-border/50 bg-muted/30 shadow-inner">
              <Image
                src={logo}
                alt=""
                width={96}
                height={96}
                className="size-full object-cover"
                unoptimized
              />
            </div>

            <h1 className="font-heading text-2xl font-bold tracking-tight">
              {church.name}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {welcome}
            </p>

            {church.country ?
              <p className="mt-3 inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" />
                {church.country}
              </p>
            : null}

            {joinBlocked ?
              <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-left text-sm text-amber-900 dark:text-amber-100">
                <div className="flex gap-2">
                  <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                  <p>
                    {church.joinBlockedReason ??
                      "This church is not accepting new members through this link."}
                  </p>
                </div>
              </div>
            : authUser ?
              <div className="mt-8 space-y-3">
                <p className="text-xs text-muted-foreground">{flowMessage}</p>
                <Button
                  className="w-full"
                  size="lg"
                  disabled={joining}
                  onClick={() => void submitJoinRequest()}
                >
                  {joining ?
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      {church.enrollmentMode === "open" ?
                        "Joining…"
                      : "Sending request…"}
                    </>
                  : church.enrollmentMode === "open" ?
                    `Join ${church.name}`
                  : `Request to join ${church.name}`}
                </Button>
              </div>
            : <div className="mt-8 space-y-3">
                <p className="text-xs text-muted-foreground">{flowMessage}</p>
                <Button
                  className={cn("w-full", googleLoading && "pointer-events-none")}
                  size="lg"
                  disabled={googleLoading}
                  onClick={() => void handleGoogleContinue()}
                >
                  {googleLoading ?
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  : <Google className="mr-2 size-4" />}
                  Continue with Google
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  <Link href={buildJoinAuthHref(slug, "/signin")}>
                    <Mail className="mr-2 size-4" />
                    Continue with Email
                  </Link>
                </Button>
                <p className="text-xs text-muted-foreground">
                  We&apos;ll sign you in or create an account automatically.
                </p>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
