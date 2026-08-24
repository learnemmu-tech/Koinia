"use client";

import { Loader2, Search } from "lucide-react";
import { useMemo, useState } from "react";

import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";

import {
  PrayerWallCard,
  PrayerWallCardSkeleton,
} from "@/components/prayer/prayer-wall-card";
import { SubmitPrayerRequestButton } from "@/components/prayer/submit-prayer-request-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApprovedPrayerRequests } from "@/hooks/use-approved-prayer-requests";
import { getPrayerRequestDisplayName } from "@/lib/prayer-request-firestore";
import { PRAYER_CATEGORIES } from "@/lib/prayer-request-validation";

type PrayerRequestsListClientProps = {
  initialRequests: FirebasePrayerRequest[];
};

function PrayerRequestsEmptyState() {
  return (
    <div className="flex flex-col items-center px-6 py-20 text-center sm:py-24">
      <div className="flex size-20 items-center justify-center rounded-2xl bg-primary/10 text-4xl">
        🙏
      </div>
      <h2 className="mt-6 text-xl font-semibold tracking-tight text-foreground">
        No prayer requests yet
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Be the first to share a prayer need with your community.
      </p>
      <SubmitPrayerRequestButton className="mt-8" label="Request Prayer" />
    </div>
  );
}

function PrayerRequestsToolbar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full max-w-[400px]">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search prayer requests…"
          className="h-10 rounded-full border-border/60 bg-background pl-10 shadow-sm"
        />
      </div>
      <Select value={category} onValueChange={onCategoryChange}>
        <SelectTrigger className="h-10 w-full rounded-full border-border/60 bg-background shadow-sm sm:w-[11rem]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {PRAYER_CATEGORIES.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function PrayerRequestsListClient({
  initialRequests,
}: PrayerRequestsListClientProps) {
  const { requests, loading, loadMore, hasMore, loadingMore } =
    useApprovedPrayerRequests(initialRequests);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const filteredRequests = useMemo(() => {
    const queryText = search.trim().toLowerCase();
    return requests.filter((request) => {
      if (category !== "all" && request.category !== category) return false;
      if (!queryText) return true;
      const haystack = [
        request.title,
        request.request,
        getPrayerRequestDisplayName(request),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(queryText);
    });
  }, [requests, search, category]);

  const showToolbar = requests.length > 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-3xl sm:size-16">
            🙏
          </div>
          <div className="min-w-0 space-y-1">
            <h1
              id="prayer-requests-heading"
              className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            >
              Prayer Wall
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              Lift each other up in prayer. Every request matters.
            </p>
          </div>
        </div>
        <SubmitPrayerRequestButton
          className="h-10 shrink-0 self-start rounded-full px-5 shadow-sm sm:ml-4"
          label="Request Prayer"
        />
      </header>

      {showToolbar ?
        <PrayerRequestsToolbar
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
        />
      : null}

      {loading && requests.length === 0 ?
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <PrayerWallCardSkeleton key={index} />
          ))}
        </div>
      : requests.length === 0 ?
        <PrayerRequestsEmptyState />
      : filteredRequests.length === 0 ?
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 px-6 py-14 text-center">
          <p className="text-sm font-medium text-foreground">
            No matching prayer requests
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your search or category filter.
          </p>
        </div>
      : <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRequests.map((request) => (
              <PrayerWallCard key={request.id} request={request} />
            ))}
          </div>
          {hasMore ?
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-full px-6 shadow-sm transition-all hover:shadow-md"
                disabled={loadingMore}
                onClick={() => void loadMore()}
              >
                {loadingMore ?
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Loading…
                  </>
                : "Load more"}
              </Button>
            </div>
          : null}
        </>
      }
    </div>
  );
}
