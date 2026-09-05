"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

import "@/styles/globals.css";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
          <div className="flex w-full max-w-md flex-col items-center text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-border bg-muted text-primary">
              <AlertCircle className="size-6" aria-hidden />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              FaithConnectHub
            </p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              We&apos;re having trouble loading FaithConnectHub right now. Please
              try again.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={reset}
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                Try again
              </button>
              <a
                href="/"
                className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium"
              >
                Go to Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
