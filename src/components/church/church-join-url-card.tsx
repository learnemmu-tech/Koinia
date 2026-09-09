"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Link2, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useOrganization } from "@/context/organization-context";
import { resolveBranchEnrollmentSettings } from "@/lib/enrollment";
import { firebaseAuth } from "@/lib/firebase-auth-service";
import { buildJoinChurchUrl } from "@/lib/join-url";
import type { BranchSettings } from "@/types/branch";
import {
  ENROLLMENT_MODES,
  type EnrollmentMode,
} from "@/types/enrollment";

type ChurchJoinUrlCardProps = {
  organizationId: string;
  branchId: string;
  slug: string;
  churchName: string;
  settings?: BranchSettings | null;
  /** Which sections to render — split across Church Settings tabs. */
  section?: "all" | "join-url" | "enrollment";
};

const ENROLLMENT_MODE_KEYS = {
  open: "modeOpen",
  approval_required: "modeApprovalRequired",
  invite_only: "modeInviteOnly",
  closed: "modeClosed",
} as const satisfies Record<EnrollmentMode, string>;

const ENROLLMENT_DESCRIPTION_KEYS = {
  open: "modeOpenDescription",
  approval_required: "modeApprovalRequiredDescription",
  invite_only: "modeInviteOnlyDescription",
  closed: "modeClosedDescription",
} as const satisfies Record<EnrollmentMode, string>;

export function ChurchJoinUrlCard({
  organizationId,
  branchId,
  slug: initialSlug,
  churchName,
  settings,
  section = "all",
}: ChurchJoinUrlCardProps) {
  const t = useTranslations("churchJoin");
  const { refetch } = useOrganization();
  const enrollment = resolveBranchEnrollmentSettings(settings);
  const [slug, setSlug] = useState(initialSlug);
  const [enrollmentMode, setEnrollmentMode] = useState<EnrollmentMode>(
    enrollment.enrollmentMode
  );
  const [joinUrlEnabled, setJoinUrlEnabled] = useState(
    enrollment.joinUrlEnabled
  );
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    setSlug(initialSlug);
    const next = resolveBranchEnrollmentSettings(settings);
    setEnrollmentMode(next.enrollmentMode);
    setJoinUrlEnabled(next.joinUrlEnabled);
  }, [initialSlug, settings]);

  const joinUrl = buildJoinChurchUrl(slug);

  const enrollmentHelp =
    enrollmentMode === "open" ?
      t("enrollmentOpenHelp")
    : enrollmentMode === "approval_required" ?
      t("enrollmentApprovalHelp")
    : t(ENROLLMENT_DESCRIPTION_KEYS[enrollmentMode]);

  async function patchSettings(body: Record<string, unknown>) {
    const user = firebaseAuth.currentUser;
    if (!user) throw new Error(t("notSignedIn"));

    const token = await user.getIdToken();
    const res = await fetch(`/api/branches/${encodeURIComponent(branchId)}/settings`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ organizationId, ...body }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error ?? t("saveSettingsFailed"));
    }

    const data = (await res.json()) as {
      slug?: string;
      settings?: BranchSettings;
    };

    if (data.slug) setSlug(data.slug);
    if (data.settings) {
      const next = resolveBranchEnrollmentSettings(data.settings);
      setEnrollmentMode(next.enrollmentMode);
      setJoinUrlEnabled(next.joinUrlEnabled);
    }

    refetch();
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      toast.success(t("joinLinkCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("copyLinkFailed"));
    }
  }

  async function handleEnrollmentChange(mode: EnrollmentMode) {
    setEnrollmentMode(mode);
    setSaving(true);
    try {
      await patchSettings({ enrollmentMode: mode });
      toast.success(t("enrollmentModeUpdated"));
    } catch (error) {
      setEnrollmentMode(enrollment.enrollmentMode);
      toast.error(error instanceof Error ? error.message : t("updateFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function handleJoinUrlToggle(enabled: boolean) {
    setJoinUrlEnabled(enabled);
    setSaving(true);
    try {
      await patchSettings({ joinUrlEnabled: enabled });
      toast.success(enabled ? t("joinLinkEnabled") : t("joinLinkDisabled"));
    } catch (error) {
      setJoinUrlEnabled(enrollment.joinUrlEnabled);
      toast.error(error instanceof Error ? error.message : t("updateFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function handleRegenerateSlug() {
    setRegenerating(true);
    try {
      await patchSettings({ regenerateSlug: true });
      toast.success(t("linkRegenerated"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("regenerationFailed"));
    } finally {
      setRegenerating(false);
    }
  }

  const showJoinUrl = section === "all" || section === "join-url";
  const showEnrollment = section === "all" || section === "enrollment";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Link2 className="size-5 text-primary" />
          <CardTitle className="text-base">
            {showEnrollment && !showJoinUrl ?
              t("enrollmentSettingsTitle")
            : t("joinLinkTitle")}
          </CardTitle>
        </div>
        <CardDescription>
          {showEnrollment && !showJoinUrl ?
            t("enrollmentDescription", { name: churchName, help: enrollmentHelp })
          : t("joinLinkDescription", { name: churchName, help: enrollmentHelp })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {showJoinUrl ?
          <>
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border/50 px-4 py-3">
              <div className="space-y-0.5">
                <Label htmlFor="join-url-enabled">{t("publicJoinLinkLabel")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("publicJoinLinkHint")}
                </p>
              </div>
              <Switch
                id="join-url-enabled"
                checked={joinUrlEnabled}
                disabled={saving}
                onCheckedChange={(checked) => void handleJoinUrlToggle(checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="join-url">{t("publicJoinUrlLabel")}</Label>
              <div className="flex gap-2">
                <Input
                  id="join-url"
                  readOnly
                  value={joinUrl}
                  className="font-mono text-xs"
                />
                <Button type="button" variant="outline" onClick={() => void handleCopy()}>
                  {copied ?
                    <Check className="size-4" />
                  : <Copy className="size-4" />}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={regenerating}
                onClick={() => void handleRegenerateSlug()}
              >
                {regenerating ?
                  <RefreshCw className="mr-1.5 size-4 animate-spin" />
                : <RefreshCw className="mr-1.5 size-4" />}
                {t("regenerateLink")}
              </Button>
            </div>
          </>
        : null}

        {showEnrollment ?
          <div className="space-y-2">
            <Label htmlFor="enrollment-mode">{t("enrollmentModeLabel")}</Label>
            <Select
              value={enrollmentMode}
              disabled={saving}
              onValueChange={(value) =>
                void handleEnrollmentChange(value as EnrollmentMode)
              }
            >
              <SelectTrigger id="enrollment-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENROLLMENT_MODES.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {t(ENROLLMENT_MODE_KEYS[mode])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t(ENROLLMENT_DESCRIPTION_KEYS[enrollmentMode])}
            </p>
          </div>
        : null}
      </CardContent>
    </Card>
  );
}
