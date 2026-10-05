"use client";

import { useTranslations } from "next-intl";
import { useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";

import {
  PrayerWallCard,
  PrayerWallCardSkeleton,
} from "@/components/prayer/prayer-wall-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRAYER_CATEGORIES } from "@/lib/prayer-request-validation";
import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";
import { listHeritagePrayerWall } from "@/templates/heritage/prayer-wall-data";
import {
  filterHeritagePrayerWallRequests,
  heritagePrayerDetailPath,
} from "@/templates/heritage/prayer";

export function HeritagePrayerWall({
  slug,
  churchId,
  initialRequests,
  loadFailed,
}: {
  slug: string;
  churchId: string;
  initialRequests: FirebasePrayerRequest[];
  loadFailed: boolean;
}) {
  const t = useTranslations("heritage.prayer");
  const tCategories = useTranslations("prayer.categories");
  const tPrayer = useTranslations("prayer");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const deferredSearch = useDeferredValue(search);

  const query = useQuery({
    queryKey: ["heritage-prayer-wall", slug],
    queryFn: () => listHeritagePrayerWall(slug),
    initialData: initialRequests,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 12_000,
    refetchIntervalInBackground: false,
  });

  const requests = query.data ?? initialRequests;
  const uniqueRequests = useMemo(() => {
    const seen = new Set<string>();
    return requests.filter((request) => {
      if (seen.has(request.id)) return false;
      seen.add(request.id);
      return true;
    });
  }, [requests]);

  const filtered = useMemo(
    () =>
      filterHeritagePrayerWallRequests(uniqueRequests, {
        churchId,
        search: deferredSearch,
        category,
      }),
    [uniqueRequests, churchId, deferredSearch, category]
  );

  const showToolbar = uniqueRequests.length > 0;
  const loadingInitial = query.isLoading && uniqueRequests.length === 0;

  if (loadFailed && uniqueRequests.length === 0) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-[var(--heritage-border)] bg-[var(--heritage-surface)] px-6 py-14 text-center text-[var(--heritage-muted)]"
      >
        {t("loadFailed")}
      </div>
    );
  }

  return (
    <div className="heritage-prayer-wall space-y-6" aria-labelledby="heritage-prayer-wall-heading">
      <h2 id="heritage-prayer-wall-heading" className="sr-only">
        {t("sharedHeading")}
      </h2>

      {showToolbar ?
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-[400px]">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--heritage-muted)]"
              aria-hidden
            />
            <label htmlFor="heritage-prayer-search" className="sr-only">
              {t("searchLabel")}
            </label>
            <Input
              id="heritage-prayer-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-10 rounded-full border-[var(--heritage-border)] bg-[var(--heritage-surface)] pl-10 shadow-none"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger
              id="heritage-prayer-category-filter"
              className="h-10 w-full rounded-full border-[var(--heritage-border)] bg-[var(--heritage-surface)] shadow-none sm:w-[11rem]"
              aria-label={t("filterCategory")}
            >
              <SelectValue placeholder={tPrayer("category")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tPrayer("allCategories")}</SelectItem>
              {PRAYER_CATEGORIES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {tCategories(item.value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      : null}

      {query.isFetching && uniqueRequests.length > 0 ?
        <p className="sr-only" aria-live="polite">
          {t("updating")}
        </p>
      : null}

      {loadingInitial ?
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <PrayerWallCardSkeleton key={index} />
          ))}
        </div>
      : query.isError && uniqueRequests.length === 0 ?
        <div
          role="alert"
          className="rounded-2xl border border-[var(--heritage-border)] bg-[var(--heritage-surface)] px-6 py-14 text-center text-[var(--heritage-muted)]"
        >
          {t("updateFailed")}
        </div>
      : uniqueRequests.length === 0 ?
        <div className="rounded-2xl border border-dashed border-[var(--heritage-border)] bg-[var(--heritage-surface)] px-6 py-16 text-center sm:py-20">
          <p className="heritage-display text-xl text-[var(--heritage-text)]">
            {t("emptyTitle")}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[var(--heritage-muted)]">
            {t("emptyDescription")}
          </p>
        </div>
      : filtered.length === 0 ?
        <div className="rounded-2xl border border-dashed border-[var(--heritage-border)] bg-[var(--heritage-muted-bg)]/50 px-6 py-14 text-center">
          <p className="text-sm font-medium text-[var(--heritage-text)]">
            {t("noMatchTitle")}
          </p>
          <p className="mt-1 text-sm text-[var(--heritage-muted)]">
            {t("noMatchDescription")}
          </p>
        </div>
      : <>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((request) => (
              <li key={request.id} className="min-w-0">
                <PrayerWallCard
                  request={request}
                  detailHref={heritagePrayerDetailPath(slug, request.id)}
                />
              </li>
            ))}
          </ul>
          {query.isFetching ?
            <div className="flex justify-center pt-1 text-[var(--heritage-muted)]">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              <span className="sr-only">{t("updatingShort")}</span>
            </div>
          : null}
        </>
      }
    </div>
  );
}
