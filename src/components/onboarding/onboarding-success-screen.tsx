"use client";



import Link from "next/link";

import { useState } from "react";

import { ArrowRight, Check, Copy, PartyPopper } from "lucide-react";

import { toast } from "sonner";



import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { buildJoinChurchUrl } from "@/lib/join-url";



type OnboardingSuccessScreenProps = {

  churchName: string;

  joinSlug: string;

};



export function OnboardingSuccessScreen({

  churchName,

  joinSlug,

}: OnboardingSuccessScreenProps) {

  const joinUrl = buildJoinChurchUrl(joinSlug);

  const [copied, setCopied] = useState(false);



  async function handleCopy() {

    try {

      await navigator.clipboard.writeText(joinUrl);

      setCopied(true);

      toast.success("Join link copied to clipboard");

      window.setTimeout(() => setCopied(false), 2000);

    } catch {

      toast.error("Could not copy link");

    }

  }



  return (

    <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-500">

      <div className="rounded-2xl border bg-card/90 p-8 text-center shadow-sm backdrop-blur-sm sm:p-10">

        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">

          <PartyPopper className="size-8" aria-hidden />

        </div>

        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">

          Your church is ready

        </h1>

        <p className="mt-3 text-base text-muted-foreground">

          <span className="font-medium text-foreground">{churchName}</span> is

          set up on FaithConnectHub. Share your join link so members can find

          you.

        </p>



        <div className="mt-8 space-y-2 text-left">

          <Label htmlFor="join-url" className="text-sm font-medium">

            Church join link

          </Label>

          <div className="flex gap-2">

            <Input

              id="join-url"

              readOnly

              value={joinUrl}

              className="font-mono text-xs sm:text-sm"

            />

            <Button

              type="button"

              variant="outline"

              size="icon"

              className="shrink-0"

              onClick={() => void handleCopy()}

              aria-label="Copy join link"

            >

              {copied ?

                <Check className="size-4 text-emerald-600" />

              : <Copy className="size-4" />}

            </Button>

          </div>

          <p className="text-xs text-muted-foreground">

            Anyone with this link can request to join your church.

          </p>

        </div>



        <Button asChild size="lg" className="mt-8 w-full sm:w-auto">
          <Link
            href="/dashboard"
            onClick={() => sessionStorage.removeItem("onboarding_show_success")}
          >
            Go to Dashboard
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>

      </div>

    </div>

  );

}

