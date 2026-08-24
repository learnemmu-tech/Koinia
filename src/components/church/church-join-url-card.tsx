"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Link2, RefreshCw } from "lucide-react";
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
  ENROLLMENT_MODE_DESCRIPTIONS,
  ENROLLMENT_MODE_LABELS,
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

export function ChurchJoinUrlCard({
  organizationId,
  branchId,
  slug: initialSlug,
  churchName,
  settings,
  section = "all",
}: ChurchJoinUrlCardProps) {
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
      "New members become active immediately after joining."
    : enrollmentMode === "approval_required" ?
      "New members appear in Pending Requests until you approve them."
    : ENROLLMENT_MODE_DESCRIPTIONS[enrollmentMode];

  async function patchSettings(body: Record<string, unknown>) {
    const user = firebaseAuth.currentUser;
    if (!user) throw new Error("Not signed in");

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
      throw new Error(data.error ?? "Failed to save settings");
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
      toast.success("Join link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }

  async function handleEnrollmentChange(mode: EnrollmentMode) {
    setEnrollmentMode(mode);
    setSaving(true);
    try {
      await patchSettings({ enrollmentMode: mode });
      toast.success("Enrollment mode updated");
    } catch (error) {
      setEnrollmentMode(enrollment.enrollmentMode);
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleJoinUrlToggle(enabled: boolean) {
    setJoinUrlEnabled(enabled);
    setSaving(true);
    try {
      await patchSettings({ joinUrlEnabled: enabled });
      toast.success(enabled ? "Join link enabled" : "Join link disabled");
    } catch (error) {
      setJoinUrlEnabled(enrollment.joinUrlEnabled);
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleRegenerateSlug() {
    setRegenerating(true);
    try {
      await patchSettings({ regenerateSlug: true });
      toast.success("Join link regenerated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Regeneration failed");
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
              "Enrollment settings"
            : "Join Church link"}
          </CardTitle>
        </div>
        <CardDescription>
          {showEnrollment && !showJoinUrl ?
            `Control how new members join ${churchName}. ${enrollmentHelp}`
          : `Share this permanent link so members can join ${churchName}. ${enrollmentHelp}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {showJoinUrl ?
          <>
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border/50 px-4 py-3">
              <div className="space-y-0.5">
                <Label htmlFor="join-url-enabled">Public join link</Label>
                <p className="text-xs text-muted-foreground">
                  When disabled, the join URL will not accept new requests.
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
              <Label htmlFor="join-url">Public join URL</Label>
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
                Regenerate link
              </Button>
            </div>
          </>
        : null}

        {showEnrollment ?
          <div className="space-y-2">
            <Label htmlFor="enrollment-mode">Enrollment mode</Label>
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
                    {ENROLLMENT_MODE_LABELS[mode]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {ENROLLMENT_MODE_DESCRIPTIONS[enrollmentMode]}
            </p>
          </div>
        : null}
      </CardContent>
    </Card>
  );
}
