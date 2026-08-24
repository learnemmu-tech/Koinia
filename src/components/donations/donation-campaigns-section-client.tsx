"use client";

import Link from "next/link";
import { ArrowRight, HeartHandshake, Loader2 } from "lucide-react";

import type { FirebaseDonationCampaign } from "@/types/firebase-donation";

import { DonationCampaignCard } from "@/components/donations/donation-campaign-card";
import { Button } from "@/components/ui/button";
import { useActiveDonationCampaigns } from "@/hooks/use-donation-campaigns";
import { splitCampaignsByCompletion } from "@/lib/donation-firestore";
import { contentCardGridClassName } from "@/lib/responsive-classes";

type DonationCampaignsSectionClientProps = {
  initialCampaigns: FirebaseDonationCampaign[];
  limit?: number;
};

export function DonationCampaignsSectionClient({
  initialCampaigns,
  limit = 3,
}: DonationCampaignsSectionClientProps) {
  const { campaigns, loading } = useActiveDonationCampaigns(initialCampaigns);
  const { active } = splitCampaignsByCompletion(campaigns);
  const displayCampaigns = active.slice(0, limit);

  if (!loading && displayCampaigns.length === 0) {
    return null;
  }

  return (
    <section className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-border/40 bg-card shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <HeartHandshake className="size-5 text-primary" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/60">
                Give
              </p>
              <h2 className="font-heading text-lg font-bold sm:text-xl">
                Support Our Ministry
              </h2>
              <p className="text-xs text-muted-foreground">
                Partner with us through active giving campaigns.
              </p>
            </div>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="shrink-0 rounded-full"
          >
            <Link href="/donations">
              View All Campaigns
              <ArrowRight className="ml-1.5 size-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {loading && displayCampaigns.length === 0 ?
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-border/50 py-14">
          <Loader2 className="size-5 animate-spin text-primary/60" />
        </div>
      : <div className={contentCardGridClassName}>
          {displayCampaigns.map((campaign) => (
            <DonationCampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      }
    </section>
  );
}
