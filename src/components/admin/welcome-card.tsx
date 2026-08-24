"use client";

import { Building2, Globe2, Sparkles } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useActiveBranch } from "@/context/active-branch-context";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useOrganization } from "@/context/organization-context";
import { adminSectionClass } from "@/lib/responsive-classes";
import {
  isIndependentChurchWorkspace,
  isMultiChurchOrgWorkspace,
} from "@/lib/organization/workspace-type";

export function WelcomeCard() {
  const { profile } = useFirebaseAuth();
  const { organization, churches } = useOrganization();
  const { activeBranch } = useActiveBranch();

  const firstName = profile?.firstName?.trim() || "there";
  const isMultiChurch = isMultiChurchOrgWorkspace(organization);
  const isIndependent = isIndependentChurchWorkspace(organization);

  const displayName =
    isMultiChurch && !activeBranch ?
      organization?.name ?? "Your organization"
    : activeBranch?.name ?? churches[0]?.name ?? organization?.name ?? "Your church";

  const country =
    activeBranch?.country?.trim() ||
    organization?.settings?.country?.trim() ||
    churches[0]?.country?.trim() ||
    "—";

  return (
    <Card
      className={`${adminSectionClass} overflow-hidden border-primary/15 bg-gradient-to-br from-primary/5 via-card to-card`}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="size-6" />
          </div>
          <div className="min-w-0 space-y-2">
            <CardTitle className="font-heading text-xl sm:text-2xl">
              Welcome, {firstName}
            </CardTitle>
            <CardDescription className="text-base leading-relaxed">
              {isMultiChurch && !activeBranch ?
                "Your organization workspace is ready. Create your first church to start managing ministry content."
              : isIndependent ?
                <>
                  You&apos;re managing{" "}
                  <span className="font-medium text-foreground">{displayName}</span>
                  . Share your join link from Church Settings to welcome members.
                </>
              : <>
                  You&apos;re managing{" "}
                  <span className="font-medium text-foreground">{displayName}</span>.
                </>
              }
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      {(isIndependent || activeBranch || isMultiChurch) && (
        <CardContent className="pt-0">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border bg-background/60 px-4 py-3">
              <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Building2 className="size-3.5" />
                {isMultiChurch && !activeBranch ? "Organization" : "Church"}
              </div>
              <p className="truncate font-medium text-foreground">{displayName}</p>
            </div>
            <div className="rounded-xl border bg-background/60 px-4 py-3">
              <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Globe2 className="size-3.5" />
                Country
              </div>
              <p className="truncate font-medium text-foreground">{country}</p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
