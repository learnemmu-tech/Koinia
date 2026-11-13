"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WebsiteTemplateGallery } from "@/components/website/website-template-gallery";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { ONBOARDING_SUCCESS_PATH } from "@/lib/auth/auth-paths";
import {
  bindFirebaseAuthCurrentUser,
  firebaseAuth,
  navigateAfterAuth,
  sessionUserFromClerk,
} from "@/lib/firebase-auth-service";
import { DEFAULT_TEMPLATE_ID } from "@/lib/templates/registry";
import { canSelectTemplate } from "@/lib/templates/resolver";
import type { TemplateId, TemplateManifest } from "@/lib/templates/types";

type OnboardingWebsiteSetupScreenProps = {
  churchId: string;
  churchName: string;
  publicSlug: string;
  templates: TemplateManifest[];
};

type WebsitePatchResponse = {
  website?: { activeTemplate?: TemplateId };
  error?: string;
};

async function getSessionToken() {
  const user = firebaseAuth.currentUser ?? sessionUserFromClerk();
  if (user) bindFirebaseAuthCurrentUser(user);
  return firebaseAuth.currentUser?.getIdToken() ?? null;
}

export function OnboardingWebsiteSetupScreen({
  churchId,
  churchName,
  publicSlug,
  templates,
}: OnboardingWebsiteSetupScreenProps) {
  const queryClient = useQueryClient();
  const { refreshProfile } = useFirebaseAuth();
  const [selectingId, setSelectingId] = useState<TemplateId | null>(null);
  const [skipping, setSkipping] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function persistTemplate(templateId: TemplateId) {
    const token = await getSessionToken();
    if (!token) {
      throw new Error("Please sign in to choose a website design.");
    }
    const response = await fetch(`/api/churches/${churchId}/website`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        activeTemplate: templateId,
        completeWebsiteSetup: true,
      }),
    });
    const data = (await response.json().catch(() => ({}))) as WebsitePatchResponse;
    if (!response.ok) {
      throw new Error(
        data.error || "Unable to save your website design. Please try again."
      );
    }
    await refreshProfile({ websiteSetupCompleted: true });
    void queryClient.invalidateQueries({ queryKey: ["organization"] });
    void queryClient.invalidateQueries({ queryKey: ["membership-routing"] });
    return data.website?.activeTemplate ?? templateId;
  }

  async function handleSelect(templateId: TemplateId) {
    const manifest = templates.find((item) => item.id === templateId);
    if (!manifest || !canSelectTemplate(manifest)) return;

    setSaveError(null);
    setSelectingId(templateId);
    try {
      await persistTemplate(templateId);
      navigateAfterAuth(ONBOARDING_SUCCESS_PATH);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Unable to save your website design. Please try again."
      );
    } finally {
      setSelectingId(null);
    }
  }

  async function handleSkipToDashboard() {
    setSaveError(null);
    setSkipping(true);
    try {
      await persistTemplate(DEFAULT_TEMPLATE_ID);
      navigateAfterAuth(ONBOARDING_SUCCESS_PATH);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Unable to save your website design. Please try again."
      );
    } finally {
      setSkipping(false);
    }
  }

  const busy = Boolean(selectingId) || skipping;

  return (
    <div className="w-full animate-in fade-in duration-500">
      <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="max-w-xl space-y-4">
          <p className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            Your church is ready
            <span className="sr-only">, {churchName}</span>
          </p>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Choose Your <span className="text-primary">Website Design</span>
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            Select a design that reflects your church&apos;s identity. You can change this later from Website Settings.
          </p>
        </div>
        <div className="relative hidden h-64 overflow-hidden lg:block lg:h-72">
          <Image
            src="/templates/heritage/hero-fallback.jpg"
            alt=""
            fill
            priority
            className="object-cover object-[center_20%] brightness-[0.92] saturate-[0.72]"
            sizes="40vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/55 to-background/10" />
        </div>
      </section>

      {saveError ? (
        <p className="mt-6 text-sm text-destructive" role="alert">
          {saveError}
        </p>
      ) : null}

      <div className="mt-8">
        <WebsiteTemplateGallery
          templates={templates}
          churchSlug={publicSlug}
          saving={busy}
          selectingId={selectingId}
          highlightActive={false}
          layout="onboarding"
          onSelect={(templateId) => void handleSelect(templateId)}
        />
      </div>

      <div className="mt-6">
        <Button
          type="button"
          variant="ghost"
          className="h-auto px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
          disabled={busy}
          onClick={() => void handleSkipToDashboard()}
        >
          {skipping ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <ArrowRight className="size-4" aria-hidden />
          )}
          Use Signature for now and go to Dashboard
        </Button>
      </div>
    </div>
  );
}
