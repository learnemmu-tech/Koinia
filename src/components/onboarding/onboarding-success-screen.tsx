"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, CheckCircle2, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useOrganization } from "@/context/organization-context";
import { setAuthSession } from "@/lib/auth/set-auth-session";
import { WORKSPACE_BASE } from "@/lib/dashboard-routes";
import { cn } from "@/lib/utils";

type OnboardingSuccessScreenProps = {
  churchName: string;
  joinUrl: string;
};

export function OnboardingSuccessScreen({
  churchName,
  joinUrl,
}: OnboardingSuccessScreenProps) {
  const queryClient = useQueryClient();
  const { refreshProfile } = useFirebaseAuth();
  const { refetch, membership, churches } = useOrganization();
  const [copied, setCopied] = useState(false);
  const syncedRef = useRef(false);

  useEffect(() => {
    if (syncedRef.current) return;
    syncedRef.current = true;

    void (async () => {
      const resolvedProfile = await refreshProfile();
      await refetch();
      await queryClient.refetchQueries({ queryKey: ["membership-routing"] });
      await queryClient.refetchQueries({ queryKey: ["organization"] });
      if (resolvedProfile) {
        setAuthSession(true, {
          role: resolvedProfile.role,
          profile: resolvedProfile,
          membership,
          churchesCount: Math.max(churches.length, 1),
          workspaceType: "independent_church",
        });
      }
    })();
  }, [refreshProfile, refetch, queryClient, membership, churches.length]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-500">
      <div className="rounded-2xl border bg-card/90 p-6 text-center shadow-sm backdrop-blur-sm sm:p-8">
        <div
          className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600"
          aria-hidden
        >
          <CheckCircle2 className="size-7" />
        </div>
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-[1.75rem]">
          Your church workspace is ready
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          <span className="break-words font-medium text-foreground">{churchName}</span>{" "}
          has been created successfully.
        </p>

        <div className="mt-7 space-y-2 text-left">
          <p id="church-join-url-label" className="text-sm font-medium">
            Your church URL
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <p
              id="church-join-url"
              tabIndex={0}
              className="min-w-0 flex-1 break-all rounded-md border bg-muted/40 px-3 py-2.5 font-mono text-xs leading-relaxed text-foreground sm:text-sm"
            >
              {joinUrl}
            </p>
            <Button
              type="button"
              variant="outline"
              className="h-11 shrink-0 sm:h-auto sm:min-w-[7.5rem]"
              onClick={() => void handleCopy()}
              aria-describedby="church-join-url-label"
              aria-label="Copy church URL"
            >
              {copied ? (
                <Check className="mr-2 size-4 text-emerald-600" />
              ) : (
                <Copy className="mr-2 size-4" />
              )}
              {copied ? "Copied" : "Copy URL"}
            </Button>
          </div>
          <p
            className={cn(
              "text-sm text-muted-foreground",
              copied && "text-emerald-700"
            )}
            aria-live="polite"
          >
            {copied
              ? "Church URL copied to clipboard."
              : "Share this link with your church members so they can join your church community."}
          </p>
        </div>

        <Button asChild size="lg" className="mt-8 h-11 w-full sm:w-auto">
          <Link href={WORKSPACE_BASE}>
            Go to Dashboard
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
