"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { PrayerWallCard } from "@/components/prayer/prayer-wall-card";
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

  const filtersActive = search.trim().length > 0 || category !== "all";
  const activeCategoryLabel =
    category === "all"
      ? null
      : PRAYER_CATEGORIES.find((item) => item.value === category)?.label ?? category;

  if (loadFailed && uniqueRequests.length === 0) {
    return (
      <div
        role="alert"
        className="mt-4 border border-[var(--heritage-border)] bg-[var(--heritage-surface)] p-6 text-[var(--heritage-muted)]"
      >
        The prayer wall could not be loaded right now. Please refresh the page
        in a moment.
      </div>
    );
  }

  return (
    <div className="min-w-0" aria-labelledby="heritage-prayer-wall-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 id="heritage-prayer-wall-heading" className="heritage-eyebrow">
          Shared requests
        </h2>
        {query.isFetching ? (
          <p className="text-xs text-[var(--heritage-muted)]" aria-live="polite">
            Updating…
          </p>
        ) : null}
      </div>

      {uniqueRequests.length > 0 ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <label htmlFor="heritage-prayer-search" className="sr-only">
              Search prayer requests
            </label>
            <input
              id="heritage-prayer-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search requests"
              className="h-11 w-full border border-[var(--heritage-border)] bg-[var(--heritage-background)] px-3 pr-20 text-[var(--heritage-text)] outline-none focus:border-[var(--heritage-accent)]"
            />
            {search ? (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-[var(--heritage-muted)] underline"
                onClick={() => setSearch("")}
              >
                Clear
              </button>
            ) : null}
          </div>
          <div className="sm:w-56">
            <label htmlFor="heritage-prayer-category-filter" className="sr-only">
              Filter by category
            </label>
            <select
              id="heritage-prayer-category-filter"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-11 w-full border border-[var(--heritage-border)] bg-[var(--heritage-background)] px-3 text-[var(--heritage-text)] outline-none focus:border-[var(--heritage-accent)]"
            >
              <option value="all">All categories</option>
              {PRAYER_CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      {filtersActive ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--heritage-muted)]">
          {activeCategoryLabel ? (
            <p>
              Category:{" "}
              <span className="text-[var(--heritage-text)]">{activeCategoryLabel}</span>
            </p>
          ) : null}
          {search.trim() ? (
            <p>
              Search:{" "}
              <span className="break-all text-[var(--heritage-text)]">
                {search.trim()}
              </span>
            </p>
          ) : null}
          <button
            type="button"
            className="underline"
            onClick={() => {
              setSearch("");
              setCategory("all");
            }}
          >
            Reset filters
          </button>
        </div>
      ) : null}

      {query.isError && uniqueRequests.length === 0 ? (
        <div
          role="alert"
          className="mt-4 border border-[var(--heritage-border)] bg-[var(--heritage-surface)] p-6 text-[var(--heritage-muted)]"
        >
          The prayer wall could not be updated right now. Please try again in a
          moment.
        </div>
      ) : uniqueRequests.length === 0 ? (
        <div className="mt-4 border border-dashed border-[var(--heritage-border)] bg-[var(--heritage-surface)] p-8 text-center">
          <p className="heritage-display text-2xl">No shared requests yet</p>
          <p className="mt-3 text-[var(--heritage-muted)]">
            When members share a request and leaders approve it, it will appear
            here so the church can pray together.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-4 border border-dashed border-[var(--heritage-border)] bg-[var(--heritage-surface)] p-8 text-center">
          <p className="heritage-display text-2xl">No matching requests</p>
          <p className="mt-3 text-[var(--heritage-muted)]">
            Try a different search or category, or reset the filters to see every
            shared request.
          </p>
        </div>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {filtered.map((request) => (
            <li key={request.id} className="min-w-0">
              <PrayerWallCard
                request={request}
                detailHref={heritagePrayerDetailPath(slug, request.id)}
                className="border-[color:var(--heritage-border)] shadow-none"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
