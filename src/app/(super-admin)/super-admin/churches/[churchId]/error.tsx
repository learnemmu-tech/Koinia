"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function SuperAdminChurchDetailsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[super-admin church details]", error);
  }, [error]);

  return (
    <div className="rounded-2xl border border-border/70 bg-card px-6 py-12 text-center">
      <p className="font-medium">Unable to load this church</p>
      <p className="mt-1 text-sm text-muted-foreground">
        The inspection query failed. Try again, or return to the organization.
      </p>
      <Button className="mt-4" onClick={reset} size="sm">
        Try again
      </Button>
    </div>
  );
}
