"use client";

import { Building2, Globe2, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("dashboard");
  const { profile } = useFirebaseAuth();
  const { organization, churches } = useOrganization();
  const { activeBranch } = useActiveBranch();

  const firstName = profile?.firstName?.trim() || t("welcomeFallbackName");
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
              {t("welcome", { name: firstName })}
            </CardTitle>
            <CardDescription className="text-base leading-relaxed">
              {isMultiChurch && !activeBranch ?
                t("workspaceReady")
              : isIndependent ?
                t.rich("managingWithJoin", {
                  church: () => (
                    <span className="font-medium text-foreground">{displayName}</span>
                  ),
                })
              : t.rich("managing", {
                  church: () => (
                    <span className="font-medium text-foreground">{displayName}</span>
                  ),
                })
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
                {isMultiChurch && !activeBranch ? t("organization") : t("church")}
              </div>
              <p className="truncate font-medium text-foreground">{displayName}</p>
            </div>
            <div className="rounded-xl border bg-background/60 px-4 py-3">
              <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Globe2 className="size-3.5" />
                {t("country")}
              </div>
              <p className="truncate font-medium text-foreground">{country}</p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
