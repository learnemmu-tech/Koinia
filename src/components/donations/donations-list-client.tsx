"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import type { FirebaseDonationCampaign } from "@/types/firebase-donation";

import { DonationCampaignCard } from "@/components/donations/donation-campaign-card";
import { ContentListToolbar } from "@/components/worship/content-list-toolbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActiveDonationCampaigns } from "@/hooks/use-donation-campaigns";
import { splitCampaignsByCompletion } from "@/lib/donation-firestore";
import { contentCardGridClassName } from "@/lib/responsive-classes";

type DonationsListClientProps = {
  initialCampaigns: FirebaseDonationCampaign[];
};

function matchesSearch(
  campaign: FirebaseDonationCampaign,
  query: string
): boolean {
  if (!query) return true;
  return campaign.title.toLowerCase().includes(query);
}

export function DonationsListClient({
  initialCampaigns,
}: DonationsListClientProps) {
  const { campaigns, loading } = useActiveDonationCampaigns(initialCampaigns);
  const { active, completed } = splitCampaignsByCompletion(campaigns);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");

  const query = search.trim().toLowerCase();

  const filteredActive = useMemo(
    () => active.filter((campaign) => matchesSearch(campaign, query)),
    [active, query]
  );
  const filteredCompleted = useMemo(
    () => completed.filter((campaign) => matchesSearch(campaign, query)),
    [completed, query]
  );

  if (loading && campaigns.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-dashed border-border/50 py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!loading && active.length === 0 && completed.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No active donation campaigns available.
        </p>
      </div>
    );
  }

  const showActive = status === "all" || status === "active";
  const showCompleted = status === "all" || status === "completed";
  const noResults =
    (showActive ? filteredActive.length : 0) +
      (showCompleted ? filteredCompleted.length : 0) ===
    0;

  return (
    <div className="space-y-6">
      <ContentListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search campaigns…"
      >
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full min-w-0 sm:w-[10rem] rounded-full">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All campaigns</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </ContentListToolbar>

      {noResults ?
        <div className="rounded-xl border border-dashed border-border/60 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No campaigns match your search.
          </p>
        </div>
      : <div className="space-y-10">
          {showActive ?
            <CampaignSection
              title="Active Campaigns"
              campaigns={filteredActive}
              emptyMessage="No active donation campaigns available."
            />
          : null}
          {showCompleted ?
            <CampaignSection
              title="Completed Campaigns"
              campaigns={filteredCompleted}
              emptyMessage="No completed campaigns yet."
            />
          : null}
        </div>
      }
    </div>
  );
}

function CampaignSection({
  title,
  campaigns,
  emptyMessage,
}: {
  title: string;
  campaigns: FirebaseDonationCampaign[];
  emptyMessage: string;
}) {
  return (
    <section className="space-y-4">
      <h2 className="font-heading text-lg font-bold sm:text-xl">{title}</h2>
      {campaigns.length === 0 ?
        <div className="rounded-2xl border border-dashed border-border/50 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      : <div className={contentCardGridClassName}>
          {campaigns.map((campaign) => (
            <DonationCampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      }
    </section>
  );
}
