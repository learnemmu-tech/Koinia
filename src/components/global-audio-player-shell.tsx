"use client";

import React from "react";

import { LazyPlayer } from "@/components/lazy-player";
import { usePlayerVisible } from "@/hooks/use-player-visible";
import { cn } from "@/lib/utils";

type GlobalAudioPlayerShellProps = {
  children: React.ReactNode;
};

export function GlobalAudioPlayerShell({
  children,
}: GlobalAudioPlayerShellProps) {
  const showPlayer = usePlayerVisible();

  return (
    <>
      <div
        className={cn(
          showPlayer &&
            "pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:pb-[calc(5.625rem+env(safe-area-inset-bottom,0px))]"
        )}
      >
        {children}
      </div>
      {showPlayer ? <LazyPlayer /> : null}
    </>
  );
}
