"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

import type { FirebaseDonationCampaign } from "@/types/firebase-donation";

import { DonateForm } from "@/components/donations/donate-form";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { Button } from "@/components/ui/button";
import { DEFAULT_SONG_COVER } from "@/config/site";
import {
  formatDonationAmount,
  getCampaignProgressPercent,
} from "@/lib/donation-firestore";
import { useDonationCampaign } from "@/hooks/use-donation-campaigns";
import { getSongCoverUrl } from "@/lib/utils";
import { typePageTitleClass } from "@/lib/responsive-classes";

type DonationCampaignDetailClientProps = {
  campaignId: string;
  initialCampaign: FirebaseDonationCampaign | null;
};

export function DonationCampaignDetailClient({
  campaignId,
  initialCampaign,
}: DonationCampaignDetailClientProps) {
  const { campaign, loading } = useDonationCampaign(campaignId, initialCampaign);

  if (loading && !campaign) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!campaign || campaign.status !== "active") {
    return (
      <div className="rounded-xl border border-dashed border-border/60 px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          This campaign is not available for donations.
        </p>
        <Button asChild variant="link" className="mt-2">
          <Link href="/donations">Back to donations</Link>
        </Button>
      </div>
    );
  }

  const coverUrl = getSongCoverUrl(campaign.bannerImage);
  const progress = getCampaignProgressPercent(campaign);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-5">
        <Button asChild variant="ghost" size="sm" className="gap-2 px-0">
          <Link href="/donations">
            <ArrowLeft className="size-4" />
            All campaigns
          </Link>
        </Button>

        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
          <div className="relative aspect-[16/9] w-full bg-muted/30">
            <ImageWithFallback
              src={coverUrl}
              fallback={DEFAULT_SONG_COVER}
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              alt={campaign.title}
              className="object-cover"
            />
          </div>
          <div className="space-y-4 p-5 sm:p-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/60">
                Active Campaign
              </p>
              <h1 className={`mt-1 ${typePageTitleClass}`}>
                {campaign.title}
              </h1>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {campaign.description}
            </p>
            <div className="space-y-2 rounded-xl border border-border/50 bg-muted/20 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Raised</span>
                <span className="font-semibold">
                  {formatDonationAmount(campaign.currentAmount, campaign.currency)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Goal {formatDonationAmount(campaign.targetAmount, campaign.currency)}
                </span>
                <span>{progress}% complete</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-2">
          <CheckCircle2 className="size-5 text-primary" />
          <h2 className="font-heading text-lg font-semibold">Make a Donation</h2>
        </div>
        <DonateForm campaign={campaign} />
      </div>
    </div>
  );
}
