"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";

/**
 * Renders page content immediately, then mounts the audio player in a later chunk.
 * Sign-in and first navigation do not parse the audio runtime up front.
 */
export function DeferredWorkspaceAudio({ children }: { children: ReactNode }) {
  const [Shell, setShell] = useState<ComponentType<{ children: ReactNode }> | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;
    void import("./workspace-audio").then((mod) => {
      if (!cancelled) setShell(() => mod.WorkspaceAudio);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!Shell) return children;
  return <Shell>{children}</Shell>;
}
