"use client";

import React from "react";

const DEFAULT_INTERVAL_MS = 30_000;

export function useEventScheduleNow(intervalMs = DEFAULT_INTERVAL_MS) {
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}
