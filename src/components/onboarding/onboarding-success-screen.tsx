"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Globe,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { WORKSPACE_BASE } from "@/lib/dashboard-routes";

type OnboardingSuccessScreenProps = {
  churchName: string;
  publicPath: string;
  publicUrl: string;
  joinUrl: string;
  selectedTemplateName: string;
};

export function OnboardingSuccessScreen({
  churchName,
  publicPath,
  publicUrl,
  joinUrl,
  selectedTemplateName,
}: OnboardingSuccessScreenProps) {
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedJoin, setCopiedJoin] = useState(false);

  async function copyValue(value: string, which: "public" | "join") {
    try {
      await navigator.clipboard.writeText(value);
      if (which === "public") {
        setCopiedPublic(true);
        setCopiedJoin(false);
        window.setTimeout(() => setCopiedPublic(false), 2000);
      } else {
        setCopiedJoin(true);
        setCopiedPublic(false);
        window.setTimeout(() => setCopiedJoin(false), 2000);
      }
    } catch {
      setCopiedPublic(false);
      setCopiedJoin(false);
    }
  }

  return (
    <div className="w-full max-w-3xl animate-in fade-in duration-500">
      <section className="rounded-3xl border bg-card/95 p-5 shadow-sm sm:p-8">
        <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="size-5" aria-hidden />
          Website ready
        </p>
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          Your church is ready
        </h1>
        <p className="mt-3 text-lg font-medium text-foreground">{churchName}</p>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">
          Your website is ready to share
          {selectedTemplateName ? ` with the ${selectedTemplateName} design` : ""}.
        </p>

        <div className="mt-8 space-y-6">
          <PublicWebsiteRow
            publicPath={publicPath}
            publicUrl={publicUrl}
            copied={copiedPublic}
            onCopy={() => void copyValue(publicUrl, "public")}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="h-11">
              <Link href={publicPath} target="_blank" rel="noopener noreferrer">
                View Website
                <ExternalLink className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11">
              <Link href={WORKSPACE_BASE}>
                Continue to Dashboard
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>

          <div className="rounded-2xl border bg-muted/30 p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Users className="size-4" aria-hidden />
              Member join link
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Share this only when you want people to request membership. It is
              not your public website.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">
                {joinUrl}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={() => void copyValue(joinUrl, "join")}
                aria-label="Copy member join link"
              >
                {copiedJoin ? (
                  <Check className="size-4 text-emerald-600" aria-hidden />
                ) : (
                  <Copy className="size-4" aria-hidden />
                )}
                {copiedJoin ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="sr-only" aria-live="polite">
              {copiedJoin ? "Member join link copied." : ""}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function PublicWebsiteRow({
  publicPath,
  publicUrl,
  copied,
  onCopy,
}: {
  publicPath: string;
  publicUrl: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-2xl border bg-background/80 p-4">
      <p className="flex items-center gap-2 text-sm font-medium">
        <Globe className="size-4" aria-hidden />
        Public website
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Visitors can open your church website here. This is not the membership
        join link.
      </p>
      <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
        <p
          className="min-w-0 flex-1 truncate font-mono text-sm text-foreground"
          title={publicUrl}
        >
          {publicUrl}
        </p>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCopy}
            aria-label="Copy public website URL"
          >
            {copied ? (
              <Check className="size-4 text-emerald-600" aria-hidden />
            ) : (
              <Copy className="size-4" aria-hidden />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={publicPath} target="_blank" rel="noopener noreferrer">
              Open
              <ExternalLink className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {copied ? "Copied." : ""}
      </p>
    </div>
  );
}
