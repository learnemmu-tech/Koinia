"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, type ThemeProviderProps } from "next-themes";

import {
  QUERY_GC_TIME,
  QUERY_STALE_TIME,
} from "@/lib/react-query-config";

import type { FirebaseChurch } from "@/types/firebase-church";

import { ActiveChurchProvider } from "@/context/active-church-context";
import { ActiveBranchProvider } from "@/context/active-branch-context";
import { FirebaseAuthProvider } from "@/context/firebase-auth-context";
import { OrganizationProvider } from "@/context/organization-context";
import { OrganizationChurchBridge } from "@/components/organization/organization-church-bridge";
import { EmailVerificationBanner } from "@/components/auth/email-verification-banner";
import { WorkspaceSessionBridge } from "@/components/auth/workspace-session-bridge";
import { OnboardingGuard } from "@/components/onboarding/onboarding-guard";
import { WorkspaceBootstrapGate } from "@/components/auth/workspace-bootstrap-gate";
import { MembershipStatusGuard } from "@/components/auth/membership-status-guard";
import { FavoritesProvider } from "@/context/favorites-context";
import { RecentlyViewedProvider } from "@/context/recently-viewed-context";
import { ContentAuthDialogProvider } from "@/context/content-auth-dialog-context";
import { SubscriptionShell } from "@/components/subscription/subscription-shell";
import { GlobalAudioPlayerShell } from "./global-audio-player-shell";
import { Toaster } from "./ui/sonner";
import { TooltipProvider } from "./ui/tooltip";

type Props = {
  theme?: ThemeProviderProps;
  initialChurches?: FirebaseChurch[];
  initialActiveChurchId?: string | null;
  children: React.ReactNode;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME,
      gcTime: QUERY_GC_TIME,
      refetchOnWindowFocus: false,
    },
  },
});

export default function Providers({
  children,
  theme,
  initialChurches = [],
  initialActiveChurchId = null,
}: Props) {
  return (
    <ThemeProvider
      attribute="class"
      enableSystem
      defaultTheme="system"
      storageKey="cfp-theme"
      disableTransitionOnChange
      themes={["light", "dark", "system"]}
      {...theme}
    >
      <ActiveChurchProvider
        initialChurches={initialChurches}
        initialActiveChurchId={initialActiveChurchId}
      >
        <FirebaseAuthProvider>
          <EmailVerificationBanner />
          <QueryClientProvider client={queryClient}>
            <OrganizationProvider>
              <OrganizationChurchBridge />
              <WorkspaceSessionBridge />
              <ActiveBranchProvider>
                <WorkspaceBootstrapGate>
                  <OnboardingGuard />
                  <MembershipStatusGuard />
                  <FavoritesProvider>
                    <RecentlyViewedProvider>
                      <ContentAuthDialogProvider>
                        <SubscriptionShell>
                          <TooltipProvider>
                            <GlobalAudioPlayerShell>
                              {children}
                            </GlobalAudioPlayerShell>
                          </TooltipProvider>
                        </SubscriptionShell>
                      </ContentAuthDialogProvider>
                    </RecentlyViewedProvider>
                  </FavoritesProvider>
                </WorkspaceBootstrapGate>
              </ActiveBranchProvider>
            </OrganizationProvider>
          </QueryClientProvider>
        </FirebaseAuthProvider>
      </ActiveChurchProvider>

      <Toaster />
    </ThemeProvider>
  );
}
