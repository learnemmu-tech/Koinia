"use client";

import Link from "next/link";
import { HeartHandshake } from "lucide-react";

import type { FirebaseDonationCampaign } from "@/types/firebase-donation";

import { ImageWithFallback } from "@/components/image-with-fallback";
import { Button } from "@/components/ui/button";
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

export function DonationCampaignCard({
  campaign,
  className,
}: DonationCampaignCardProps) {
  const href = `/donations/${encodeURIComponent(campaign.id)}`;
  const coverUrl = getSongCoverUrl(campaign.bannerImage);
  const progress = getCampaignProgressPercent(campaign);

  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card/40 shadow-sm",
        className
      )}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted/30">
        <ImageWithFallback
          src={coverUrl}
          fallback={DEFAULT_SONG_COVER}
          fill
          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
          alt={campaign.title}
          className="object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <div className="space-y-2">
          <h3 className="font-heading text-lg font-semibold leading-snug">
            {campaign.title}
          </h3>
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {campaign.description}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Raised {formatDonationAmount(campaign.currentAmount, campaign.currency)}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Goal {formatDonationAmount(campaign.targetAmount, campaign.currency)}
          </p>
        </div>

        <Button asChild className="mt-auto w-full gap-2">
          <Link href={href}>
            <HeartHandshake className="size-4" />
            Donate Now
          </Link>
        </Button>
      </div>
    </article>
  );
}
