"use client";

import Link from "next/link";

import type { FirebaseDonationCampaign } from "@/types/firebase-donation";

import { DonateForm } from "@/components/donations/donate-form";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_SONG_COVER } from "@/config/site";
import {
  formatDonationAmount,
  getCampaignProgressPercent,
} from "@/lib/donation-firestore";
import { useDonationCampaign } from "@/hooks/use-donation-campaigns";
import { getSongCoverUrl } from "@/lib/utils";

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

export function DonationCampaignDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="grid gap-8 lg:grid-cols-[11fr_9fr] lg:gap-10">
        <div className="space-y-5">
          <Skeleton className="h-4 w-32 bg-[#1A1A1A]" />
          <Skeleton className="h-56 w-full rounded-2xl bg-[#111111] sm:h-64 lg:h-[280px]" />
          <Skeleton className="h-6 w-36 rounded-full bg-[#1A1A1A]" />
          <Skeleton className="h-8 w-4/5 max-w-md bg-[#1A1A1A]" />
          <Skeleton className="h-4 w-full max-w-sm bg-[#1A1A1A]" />
          <Skeleton className="h-2 w-full rounded-full bg-[#1A1A1A]" />
          <Skeleton className="h-4 w-28 bg-[#1A1A1A]" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full bg-[#1A1A1A]" />
            <Skeleton className="h-4 w-full bg-[#1A1A1A]" />
            <Skeleton className="h-4 w-3/4 bg-[#1A1A1A]" />
          </div>
        </div>
        <div className="rounded-2xl border border-[#1F1F1F] bg-[#111111] p-7">
          <Skeleton className="h-7 w-48 bg-[#1A1A1A]" />
          <Skeleton className="mt-3 h-0.5 w-12 bg-[#1A1A1A]" />
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-[52px] rounded-[10px] bg-[#1A1A1A]" />
            ))}
          </div>
          <Skeleton className="mt-5 h-12 w-full rounded-[10px] bg-[#1A1A1A]" />
          <Skeleton className="mt-4 h-12 w-full rounded-[10px] bg-[#1A1A1A]" />
          <Skeleton className="mt-4 h-12 w-full rounded-[10px] bg-[#1A1A1A]" />
          <Skeleton className="mt-6 h-[52px] w-full rounded-[10px] bg-[#1A1A1A]" />
        </div>
      </div>
    </div>
  );
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
      <div className="mx-auto flex min-h-[320px] w-full max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="font-heading text-2xl font-bold text-white">
          Campaign not found
        </h1>
        <p className="mt-2 text-sm text-[#6B7280]">
          This campaign is not available for donations.
        </p>
        <Button
          asChild
          className="mt-6 h-11 rounded-[10px] bg-white px-6 text-black hover:bg-[#E5E5E5]"
        >
          <Link href="/donations">← All Campaigns</Link>
        </Button>
      </div>
    );
  }

  const coverUrl = getSongCoverUrl(campaign.bannerImage);
  const progress = getCampaignProgressPercent(campaign);
  const descriptionParagraphs = splitCampaignDescription(campaign.description);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="grid gap-8 lg:grid-cols-[11fr_9fr] lg:items-start lg:gap-10">
        <div className="min-w-0 space-y-5">
          <Link
            href="/donations"
            className="inline-flex items-center text-sm text-[#6B7280] transition-colors hover:text-white"
          >
            ← All Campaigns
          </Link>

          <div className="relative h-56 w-full overflow-hidden rounded-2xl border border-[#1F1F1F] sm:h-64 lg:h-[280px]">
            <ImageWithFallback
              src={coverUrl}
              fallback={DEFAULT_SONG_COVER}
              fill
              sizes="(min-width: 1024px) 55vw, 100vw"
              alt={campaign.title}
              className="object-cover"
              priority
            />
          </div>

          <div>
            <span className="inline-flex items-center rounded-full border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#A1A1A1]">
              Active Campaign
            </span>

            <h1 className="mt-3 font-heading text-[26px] font-bold leading-tight text-white">
              {campaign.title}
            </h1>

            <div className="mt-4 space-y-2">
              <p className="text-base font-semibold text-white">
                {formatDonationAmount(campaign.currentAmount, campaign.currency)}{" "}
                raised of{" "}
                {formatDonationAmount(campaign.targetAmount, campaign.currency)}{" "}
                goal
              </p>
              <div className="h-2 overflow-hidden rounded-full bg-[#1A1A1A]">
                <div
                  className="h-full rounded-full bg-white transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-[#6B7280]">{progress}% funded</p>
            </div>

            {descriptionParagraphs.length > 0 ?
              <div className="mt-6 max-w-prose space-y-4">
                {descriptionParagraphs.map((paragraph, index) => (
                  <p
                    key={`${index}-${paragraph.slice(0, 24)}`}
                    className="text-[15px] leading-[1.75] text-[#A1A1A1]"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            : null}
          </div>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-[#1F1F1F] bg-[#111111] p-7">
            <div className="mb-5">
              <div className="flex items-center gap-2">
                <span className="text-2xl leading-none" aria-hidden>
                  ❤️
                </span>
                <h2 className="text-xl font-bold text-white">Make a Donation</h2>
              </div>
              <div className="mt-3 h-0.5 w-12 rounded-full bg-white" />
            </div>
            <DonateForm campaign={campaign} />
          </div>
        </div>
      </div>
    </div>
  );
}
