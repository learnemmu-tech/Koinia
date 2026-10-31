"use client";

import { useEffect, type ReactNode } from "react";
import { AudioPlayerProvider } from "react-use-audio-player";

import { GlobalAudioPlayerShell } from "@/components/global-audio-player-shell";

declare global {
  interface Window {
    __fchAudioReady?: boolean;
  }
}

/** Audio runtime is a separate chunk so sign-in and first paint do not parse it. */
export function WorkspaceAudio({ children }: { children: ReactNode }) {
  useEffect(() => {
    window.__fchAudioReady = true;
    window.dispatchEvent(new Event("fch-audio-ready"));
  }, []);

  return (
    <AudioPlayerProvider>
      <GlobalAudioPlayerShell>{children}</GlobalAudioPlayerShell>
    </AudioPlayerProvider>
  );
}
