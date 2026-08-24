import { format, startOfMonth, subMonths } from "date-fns";

import type { FirebaseArticle } from "@/types/firebase-article";
import type { FirebaseDonation } from "@/types/firebase-donation";
import type { FirebaseSong } from "@/types/firebase-song";
import type { FirebaseSermon } from "@/types/firebase-sermon";

import { toMillis } from "./firebase-utils";

export type AnalyticsContentItem = {
  id: string;
  title: string;
  churchId: string;
};

export type RankedContentInsight = {
  itemId: string;
  title: string;
  count: number;
};

export type RecentUserRow = {
  id: string;
  name: string;
  email: string;
  createdAt: number;
};

export type MonthlyDonationPoint = {
  month: string;
  label: string;
  amount: number;
  count: number;
};

export type ContentGrowthPoint = {
  month: string;
  label: string;
  songs: number;
  sermons: number;
  articles: number;
};

export function buildMonthKeys(monthCount = 12): string[] {
  const now = new Date();
  return Array.from({ length: monthCount }, (_, index) => {
    const date = startOfMonth(subMonths(now, monthCount - 1 - index));
    return format(date, "yyyy-MM");
  });
}

export function monthKeyFromTimestamp(timestamp: number): string {
  return format(new Date(timestamp), "yyyy-MM");
}

export function monthLabelFromKey(key: string): string {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return format(date, "MMM yyyy");
}

export function aggregateMonthlyDonations(
  donations: FirebaseDonation[],
  monthCount = 12
): MonthlyDonationPoint[] {
  const monthKeys = buildMonthKeys(monthCount);
  const totals = new Map<string, { amount: number; count: number }>();

  for (const key of monthKeys) {
    totals.set(key, { amount: 0, count: 0 });
  }

  for (const donation of donations) {
    if (donation.paymentStatus !== "completed") continue;
    const key = monthKeyFromTimestamp(donation.createdAt);
    const bucket = totals.get(key);
    if (!bucket) continue;
    bucket.amount += donation.amount;
    bucket.count += 1;
  }

  return monthKeys.map((key) => {
    const bucket = totals.get(key) ?? { amount: 0, count: 0 };
    return {
      month: key,
      label: monthLabelFromKey(key),
      amount: bucket.amount,
      count: bucket.count,
    };
  });
}

export function aggregateContentGrowth(
  songs: FirebaseSong[],
  sermons: FirebaseSermon[],
  articles: FirebaseArticle[],
  monthCount = 12
): ContentGrowthPoint[] {
  const monthKeys = buildMonthKeys(monthCount);
  const counts = new Map<
    string,
    { songs: number; sermons: number; articles: number }
  >();

  for (const key of monthKeys) {
    counts.set(key, { songs: 0, sermons: 0, articles: 0 });
  }

  for (const song of songs) {
    const key = monthKeyFromTimestamp(song.createdAt);
    const bucket = counts.get(key);
    if (bucket) bucket.songs += 1;
  }

  for (const sermon of sermons) {
    const key = monthKeyFromTimestamp(sermon.dateCreated);
    const bucket = counts.get(key);
    if (bucket) bucket.sermons += 1;
  }

  for (const article of articles) {
    const key = monthKeyFromTimestamp(article.dateCreated);
    const bucket = counts.get(key);
    if (bucket) bucket.articles += 1;
  }

  let runningSongs = 0;
  let runningSermons = 0;
  let runningArticles = 0;

  return monthKeys.map((key) => {
    const bucket = counts.get(key) ?? { songs: 0, sermons: 0, articles: 0 };
    runningSongs += bucket.songs;
    runningSermons += bucket.sermons;
    runningArticles += bucket.articles;

    return {
      month: key,
      label: monthLabelFromKey(key),
      songs: runningSongs,
      sermons: runningSermons,
      articles: runningArticles,
    };
  });
}

export function rankContentByCounts(
  counts: Map<string, number>,
  items: AnalyticsContentItem[]
): RankedContentInsight | null {
  const itemLookup = new Map(items.map((item) => [item.id, item]));
  let top: RankedContentInsight | null = null;

  for (const [itemId, count] of counts.entries()) {
    const item = itemLookup.get(itemId);
    if (!item || count <= 0) continue;
    if (!top || count > top.count) {
      top = { itemId, title: item.title, count };
    }
  }

  return top;
}

export function buildCountsFromRecords(
  records: Array<{ itemId: string; itemType: string }>,
  itemType: string
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const record of records) {
    if (record.itemType !== itemType) continue;
    counts.set(record.itemId, (counts.get(record.itemId) ?? 0) + 1);
  }

  return counts;
}

export function normalizeUserCreatedAt(value: unknown): number {
  return toMillis(value);
}

export function formatCurrency(amount: number, currency = "INR"): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return amount.toLocaleString();
  }
}
