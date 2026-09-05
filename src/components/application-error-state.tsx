"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

type ApplicationErrorStateProps = {
  onRetry?: () => void;
};

export function ApplicationErrorState({ onRetry }: ApplicationErrorStateProps) {
  return (
    <div className="flex min-h-[min(100dvh,40rem)] flex-col items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-border/60 bg-muted/40 text-primary">
          <AlertCircle className="size-6" aria-hidden />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          FaithConnectHub
        </p>
        <h1 className="mt-2 font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          We&apos;re having trouble loading FaithConnectHub right now. Please try
          again.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {onRetry ?
            <Button type="button" onClick={onRetry}>
              Try again
            </Button>
          : null}
          <Button type="button" variant="outline" asChild>
            <Link href="/">Go to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
