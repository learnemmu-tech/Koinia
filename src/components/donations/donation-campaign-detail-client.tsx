"use client";

import Link from "next/link";
import { CalendarDays, Heart } from "lucide-react";

import type { FirebaseDonationCampaign } from "@/types/firebase-donation";

import { ContentAreaLoading } from "@/components/content-area-loading";
import { DonateForm } from "@/components/donations/donate-form";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { Button } from "@/components/ui/button";
import { DEFAULT_SONG_COVER } from "@/config/site";
import {
  formatDonationAmount,
  getCampaignProgressPercent,
} from "@/lib/donation-firestore";
import { useDonationCampaign } from "@/hooks/use-donation-campaigns";
import { cn, getSongCoverUrl } from "@/lib/utils";

type DonationCampaignDetailClientProps = {
  campaignId: string;
  initialCampaign: FirebaseDonationCampaign | null;
};

function splitCampaignDescription(description: string): string[] {
  const text = description.replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  const byParagraph = text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (byParagraph.length > 1) return byParagraph;

  const byLine = text
    .split(/\n/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (byLine.length > 1) return byLine;

  if (text.length > 280) {
    const bySentence = text
      .split(/(?<=[.!?])\s+/)
      .map((part) => part.trim())
      .filter(Boolean);
    if (bySentence.length > 1) return bySentence;
  }

  return [text];
}

function formatCampaignDate(ms: number): string | null {
  if (!ms || !Number.isFinite(ms)) return null;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function DonationCampaignDetailSkeleton() {
  return <ContentAreaLoading />;
}

export function DonationCampaignDetailClient({
  campaignId,
  initialCampaign,
}: DonationCampaignDetailClientProps) {
  const { campaign, loading } = useDonationCampaign(campaignId, initialCampaign);

  if (loading && !campaign) {
    return <DonationCampaignDetailSkeleton />;
  }

  if (!campaign || campaign.status !== "active") {
    return (
      <div className="mx-auto flex min-h-[280px] w-full max-w-lg flex-col items-center justify-center px-4 py-14 text-center">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Campaign not found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This campaign is not available for donations.
        </p>
        <Button asChild className="mt-6 h-11 rounded-xl px-6">
          <Link href="/donations">← All Campaigns</Link>
        </Button>
      </div>
    );
  }

  const coverUrl = getSongCoverUrl(campaign.bannerImage);
  const progress = getCampaignProgressPercent(campaign);
  const isCompleted = progress >= 100;
  const descriptionParagraphs = splitCampaignDescription(campaign.description);
  const heroExcerpt =
    campaign.description.trim().length > 220 ?
      `${campaign.description.trim().slice(0, 220).trimEnd()}…`
    : campaign.description.trim();
  const createdLabel = formatCampaignDate(campaign.createdAt);
  const raised = formatDonationAmount(campaign.currentAmount, campaign.currency);
  const goal = formatDonationAmount(campaign.targetAmount, campaign.currency);

  return (
    <article className="mx-auto w-full max-w-6xl space-y-7 px-4 pb-10 pt-4 sm:px-6 lg:pt-6">
      <Link
        href="/donations"
        className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        ← All Campaigns
      </Link>

      {/* Hero: image + campaign info */}
      <section className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-8">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-muted shadow-sm sm:max-h-[360px] lg:aspect-[4/3] lg:max-h-[400px]">
          <ImageWithFallback
            src={coverUrl}
            fallback={DEFAULT_SONG_COVER}
            fill
            sizes="(min-width: 1024px) 45vw, 100vw"
            alt={campaign.title}
            className="object-cover"
            priority
          />
        </div>

        <div className="flex min-w-0 flex-col items-start gap-3 lg:pt-1">
          <span
            className={cn(
              "inline-flex h-7 items-center rounded-full px-2.5 text-[11px] font-semibold",
              isCompleted ?
                "bg-muted text-muted-foreground"
              : "bg-[hsl(var(--primary-subtle))] text-primary"
            )}
          >
            {isCompleted ? "Completed" : "Active Campaign"}
          </span>

          <h1 className="font-heading text-[1.75rem] font-semibold leading-[1.15] tracking-tight text-foreground sm:text-[2.125rem]">
            {campaign.title}
          </h1>

          {heroExcerpt ?
            <p className="max-w-xl text-[0.95rem] leading-relaxed text-muted-foreground sm:text-base">
              {heroExcerpt}
            </p>
          : null}

          <div className="mt-1 flex flex-col gap-2 text-sm text-foreground/90">
            {createdLabel ?
              <p className="inline-flex items-center gap-2">
                <CalendarDays
                  className="size-[1.125rem] shrink-0 text-primary/85"
                  aria-hidden
                />
                <span>
                  <span className="text-muted-foreground">Started </span>
                  {createdLabel}
                </span>
              </p>
            : null}
          </div>
        </div>
      </section>

      {/* Progress */}
      <section className="rounded-2xl border border-border/60 bg-card px-5 py-4 shadow-sm sm:px-6 sm:py-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {raised}
              <span className="ml-1.5 text-base font-normal text-muted-foreground">
                raised
              </span>
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              of {goal} goal
            </p>
          </div>
          <p className="text-sm font-semibold tabular-nums text-foreground">
            {progress}%
          </p>
        </div>
        <div
          className="mt-3.5 h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${progress}% funded`}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </section>

      {/* About + Donate */}
      <section className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-7">
        <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
          <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
            About This Campaign
          </h2>
          {descriptionParagraphs.length > 0 ?
            <div className="mt-3.5 max-w-prose space-y-4">
              {descriptionParagraphs.map((paragraph, index) => (
                <p
                  key={`${index}-${paragraph.slice(0, 24)}`}
                  className="text-[0.95rem] leading-[1.7] text-foreground/90 sm:text-base"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          : <p className="mt-3 text-sm text-muted-foreground">
              No additional campaign details have been added yet.
            </p>
          }
        </section>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <div className="flex items-center gap-2">
                <Heart className="size-4 text-primary" aria-hidden />
                <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
                  Make a Donation
                </h2>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Your gift brings hope, support, and change to families in need.
              </p>
            </div>
            <DonateForm campaign={campaign} />
          </div>
        </aside>
      </section>
    </article>
  );
}
