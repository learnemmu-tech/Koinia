"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

type FetchErrorBannerProps = {
  message?: string;
  onRetry?: () => void;
};

export function FetchErrorBanner({
  message = "Unable to load data. Please check your connection and try again.",
  onRetry,
}: FetchErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-start gap-2 text-sm text-destructive">
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>{message}</span>
      </div>
      {onRetry ?
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-2"
          onClick={onRetry}
        >
          <RefreshCw className="size-3.5" />
          Retry
        </Button>
      : null}
    </div>
  );
}
