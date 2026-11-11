"use client";

import { useMemo, useState } from "react";
import { Info } from "lucide-react";
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
import { useSubscriptionOptional } from "@/context/subscription-context";
import { useActiveDonationCampaigns } from "@/hooks/use-donation-campaigns";
import { splitCampaignsByCompletion } from "@/lib/donation-firestore";
import { contentCardGridClassName } from "@/lib/responsive-classes";

type DonationsListClientProps = {
  initialCampaigns: FirebaseDonationCampaign[];
  isPlatformPublic?: boolean;
  /** When false, skip client refetch so church-site listings stay on the server snapshot. */
  clientSync?: boolean;
  hrefPrefix?: string;
  /** Donations page only. Public church give pages keep the generic empty state. */
  applyDonationEntitlement?: boolean;
};

function matchesSearch(
  campaign: FirebaseDonationCampaign,
  query: string
): boolean {
  if (!query) return true;
  const haystack = [campaign.title, campaign.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export function DonationsListClient({
  initialCampaigns,
  isPlatformPublic = false,
  clientSync,
  hrefPrefix,
  applyDonationEntitlement = false,
}: DonationsListClientProps) {
  const t = useTranslations("donations");
  const subscription = useSubscriptionOptional();
  const donationsUnavailable =
    applyDonationEntitlement &&
    subscription != null &&
    !subscription.loading &&
    subscription.snapshot != null &&
    !subscription.canUseFeature("canCreateDonations");
  const { campaigns, loading } = useActiveDonationCampaigns(initialCampaigns, {
    clientSync: clientSync ?? !isPlatformPublic,
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
    if (donationsUnavailable) {
      return (
        <div className="-mt-4 mx-auto flex w-full max-w-3xl flex-col items-center px-4 text-center sm:-mt-6">
          <img
            src="/images/donation-empty-illustration.png"
            alt=""
            className="h-auto w-full max-w-[min(100%,360px)] object-contain"
          />
          <h2 className="mt-1 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            No Donation Campaigns Yet
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            Donation campaigns are not included in your current Free Trial.
            <br className="hidden sm:block" />
            Upgrade your plan to unlock church fundraising.
          </p>
          <div className="mt-4 flex w-full max-w-2xl items-center gap-4 rounded-2xl border border-border bg-surface-raised px-4 py-4 text-left sm:px-5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-primary text-primary">
              <Info className="size-4" aria-hidden />
            </span>
            <span className="h-8 w-px shrink-0 bg-border" aria-hidden />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-primary">
                Available with an eligible paid plan
              </span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                Upgrade your subscription to create and manage donation campaigns.
              </span>
            </span>
          </div>
        </div>
      );
    }

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
              hrefPrefix={hrefPrefix}
            />
          : null}
          {showCompleted ?
            <CampaignSection
              title={t("completedTitle")}
              campaigns={filteredCompleted}
              emptyMessage={t("noCompleted")}
              hrefPrefix={hrefPrefix}
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
  hrefPrefix,
}: {
  title: string;
  campaigns: FirebaseDonationCampaign[];
  emptyMessage: string;
  hrefPrefix?: string;
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
            <DonationCampaignCard
              key={campaign.id}
              campaign={campaign}
              hrefPrefix={hrefPrefix}
            />
          ))}
        </div>
      }
    </section>
  );
}
