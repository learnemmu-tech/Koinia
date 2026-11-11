"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";

import { ActiveChurchProvider } from "@/context/active-church-context";
import { ContentAuthDialogProvider } from "@/context/content-auth-dialog-context";
import { FirebaseAuthProvider } from "@/context/firebase-auth-context";
import { QUERY_GC_TIME, QUERY_STALE_TIME } from "@/lib/react-query-config";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME,
      gcTime: QUERY_GC_TIME,
      refetchOnWindowFocus: false,
    },
  },
});

/** Public church pages. Signed-in workspace providers stay in a separate module. */
export function PublicChurchProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      enableSystem
      defaultTheme="light"
      storageKey="cfp-theme"
      disableTransitionOnChange
      themes={["light", "dark", "system"]}
    >
      <ActiveChurchProvider initialChurches={[]} initialActiveChurchId={null}>
        <FirebaseAuthProvider>
          <QueryClientProvider client={queryClient}>
            <ContentAuthDialogProvider>
              <TooltipProvider>{children}</TooltipProvider>
            </ContentAuthDialogProvider>
          </QueryClientProvider>
        </FirebaseAuthProvider>
      </ActiveChurchProvider>
      <Toaster />
    </ThemeProvider>
  );
}
