"use client";

import React from "react";

import { ApplicationErrorState } from "@/components/application-error-state";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return <ApplicationErrorState onRetry={reset} />;
}
