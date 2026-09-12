"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import type { FirebaseDonationCampaign } from "@/types/firebase-donation";

import { DonationCampaignCard } from "@/components/donations/donation-campaign-card";
import { ContentAreaLoading } from "@/components/content-area-loading";
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
  isPlatformPublic?: boolean;
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
  isPlatformPublic = false,
}: DonationsListClientProps) {
  const t = useTranslations("donations");
  const { campaigns, loading } = useActiveDonationCampaigns(initialCampaigns, {
    clientSync: !isPlatformPublic,
  });
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
    return <ContentAreaLoading />;
  }

  if (!loading && active.length === 0 && completed.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          {t("empty")}
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
        searchPlaceholder={t("searchPlaceholder")}
      >
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full min-w-0 sm:w-[10rem] rounded-full">
            <SelectValue placeholder={t("status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allCampaigns")}</SelectItem>
            <SelectItem value="active">{t("active")}</SelectItem>
            <SelectItem value="completed">{t("completed")}</SelectItem>
          </SelectContent>
        </Select>
      </ContentListToolbar>

      {noResults ?
        <div className="rounded-xl border border-dashed border-border/60 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {t("noMatch")}
          </p>
        </div>
      : <div className="space-y-10">
          {showActive ?
            <CampaignSection
              title={t("activeTitle")}
              campaigns={filteredActive}
              emptyMessage={t("empty")}
            />
          : null}
          {showCompleted ?
            <CampaignSection
              title={t("completedTitle")}
              campaigns={filteredCompleted}
              emptyMessage={t("noCompleted")}
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
      <h2 className="font-heading text-lg font-semibold tracking-tight sm:text-xl">
        {title}
      </h2>
      {campaigns.length === 0 ?
        <div className="rounded-2xl border border-dashed border-border/50 px-6 py-10 text-center">
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
