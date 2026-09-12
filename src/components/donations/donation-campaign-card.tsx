"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { FirebaseDonationCampaign } from "@/types/firebase-donation";

import { ImageWithFallback } from "@/components/image-with-fallback";
import { DEFAULT_SONG_COVER } from "@/config/site";
import {
  formatDonationAmount,
  getCampaignProgressPercent,
} from "@/lib/donation-firestore";
import { cn, getSongCoverUrl } from "@/lib/utils";

type DonationCampaignCardProps = {
  campaign: FirebaseDonationCampaign;
  className?: string;
};

function campaignListingStatus(
  campaign: FirebaseDonationCampaign
): { label: string; tone: "active" | "completed" } {
  if (getCampaignProgressPercent(campaign) >= 100) {
    return { label: "Completed", tone: "completed" };
  }
  return { label: "Active", tone: "active" };
}

export function DonationCampaignCard({
  campaign,
  className,
}: DonationCampaignCardProps) {
  const href = `/donations/${encodeURIComponent(campaign.id)}`;
  const coverUrl = getSongCoverUrl(campaign.bannerImage);
  const progress = getCampaignProgressPercent(campaign);
  const status = campaignListingStatus(campaign);
  const raised = formatDonationAmount(campaign.currentAmount, campaign.currency);
  const goal = formatDonationAmount(campaign.targetAmount, campaign.currency);

  return (
    <article
      className={cn(
        "app-interactive app-mobile-card group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm",
        "transition-[border-color,box-shadow] duration-150 hover:border-primary/30 hover:shadow-md",
        className
      )}
    >
      <Link href={href} className="relative block aspect-[16/9] w-full overflow-hidden bg-muted/30">
        <ImageWithFallback
          src={coverUrl}
          fallback={DEFAULT_SONG_COVER}
          fill
          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
          alt={campaign.title}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <span
          className={cn(
            "absolute left-3 top-3 inline-flex h-7 items-center rounded-full px-2.5 text-[11px] font-semibold",
            status.tone === "completed" ?
              "bg-card/95 text-muted-foreground ring-1 ring-border/70"
            : "bg-[hsl(var(--primary-subtle))] text-primary"
          )}
        >
          {status.label}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-3.5 p-4 sm:p-5">
        <div className="min-w-0 space-y-1.5">
          <h3 className="line-clamp-2 font-heading text-[1.05rem] font-semibold leading-snug tracking-tight text-foreground sm:text-lg">
            <Link
              href={href}
              className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {campaign.title}
            </Link>
          </h3>
          {campaign.description.trim() ?
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {campaign.description}
            </p>
          : null}
        </div>

        <div className="mt-auto space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <p className="min-w-0 text-sm">
              <span className="font-semibold text-foreground">{raised}</span>
              <span className="text-muted-foreground"> raised of </span>
              <span className="text-muted-foreground">{goal}</span>
            </p>
            <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
              {progress}%
            </span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-muted"
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
        </div>

        <Link
          href={href}
          className={cn(
            "inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-border/70 bg-card px-4 text-sm font-semibold text-foreground",
            "transition-colors hover:border-primary/35 hover:bg-muted/40",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          View Campaign
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>
    </article>
  );
}
