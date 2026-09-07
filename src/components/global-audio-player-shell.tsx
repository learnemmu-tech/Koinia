"use client";

import React from "react";

import { Player } from "@/components/player";
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
          "min-h-0 has-[[data-page-fullbleed]]:h-svh has-[[data-page-fullbleed]]:max-h-svh has-[[data-page-fullbleed]]:overflow-hidden",
          showPlayer &&
            "pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:pb-[calc(5.625rem+env(safe-area-inset-bottom,0px))]"
        )}
      >
        {children}
      </div>
      <Player />
    </>
  );
}
