"use client";

import type { ReactNode } from "react";
import {
  BookOpen,
  DollarSign,
  HandHeart,
  Heart,
  Music2,
  Video,
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { useFavorites } from "@/context/favorites-context";
import { useUserDonations } from "@/hooks/use-user-donations";
import { useUserPrayerRequests } from "@/hooks/use-user-prayer-requests";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: number | string;
  icon: ReactNode;
  loading?: boolean;
  accentClassName?: string;
};

function StatCard({
  label,
  value,
  icon,
  loading,
  accentClassName,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {loading ?
            <Skeleton className="h-8 w-12" />
          : <p className="font-heading text-2xl font-bold">{value}</p>}
        </div>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            accentClassName
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export function DashboardStatsCards() {
  const { favorites, loading: favoritesLoading } = useFavorites();
  const { requests, loading: prayersLoading } = useUserPrayerRequests();
  const { completedDonations, loading: donationsLoading } = useUserDonations();

  const songCount = favorites.filter((item) => item.itemType === "song").length;
  const sermonCount = favorites.filter(
    (item) => item.itemType === "sermon"
  ).length;
  const articleCount = favorites.filter(
    (item) => item.itemType === "article"
  ).length;

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/60">
          Overview
        </p>
        <h2 className="font-heading text-xl font-bold">Your Statistics</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Favorite Songs"
          value={songCount}
          loading={favoritesLoading}
          icon={<Music2 className="size-5 text-rose-500" />}
          accentClassName="bg-rose-500/10"
        />
        <StatCard
          label="Favorite Sermons"
          value={sermonCount}
          loading={favoritesLoading}
          icon={<Video className="size-5 text-violet-500" />}
          accentClassName="bg-violet-500/10"
        />
        <StatCard
          label="Favorite Articles"
          value={articleCount}
          loading={favoritesLoading}
          icon={<BookOpen className="size-5 text-sky-500" />}
          accentClassName="bg-sky-500/10"
        />
        <StatCard
          label="Prayer Requests"
          value={requests.length}
          loading={prayersLoading}
          icon={<HandHeart className="size-5 text-amber-500" />}
          accentClassName="bg-amber-500/10"
        />
        <StatCard
          label="Donations Made"
          value={completedDonations.length}
          loading={donationsLoading}
          icon={<DollarSign className="size-5 text-emerald-500" />}
          accentClassName="bg-emerald-500/10"
        />
        <StatCard
          label="Total Favorites"
          value={favorites.length}
          loading={favoritesLoading}
          icon={<Heart className="size-5 fill-current text-red-500" />}
          accentClassName="bg-red-500/10"
        />
      </div>
    </section>
  );
}
