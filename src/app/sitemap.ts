import type { MetadataRoute } from "next";

import { PUBLIC_PLATFORM_CONTENT_QUERY } from "@/lib/content/content-scope";
import { getActiveDonationCampaignsCached } from "@/lib/cached-donation-data";
import { getPublishedEventsGroupedCached } from "@/lib/cached-event-data";
import {
  getPublishedArticlesCached,
  getPublishedSermonsCached,
  getPublishedSongsCached,
} from "@/lib/cached-worship-data";
import { listPublishedCatalogBooks } from "@/lib/postgres/books";
import { STATIC_SITEMAP_PATHS } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [songs, sermons, articles, eventsGrouped, campaigns, books] = await Promise.all([
    getPublishedSongsCached(PUBLIC_PLATFORM_CONTENT_QUERY).catch(() => []),
    getPublishedSermonsCached(PUBLIC_PLATFORM_CONTENT_QUERY).catch(() => []),
    getPublishedArticlesCached(PUBLIC_PLATFORM_CONTENT_QUERY).catch(() => []),
    getPublishedEventsGroupedCached(PUBLIC_PLATFORM_CONTENT_QUERY).catch(() => ({
      upcoming: [],
      past: [],
    })),
    getActiveDonationCampaignsCached(PUBLIC_PLATFORM_CONTENT_QUERY).catch(() => []),
    listPublishedCatalogBooks().catch(() => []),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_SITEMAP_PATHS.map(
    ({ path, priority, changeFrequency }) => ({
      url: absoluteUrl(path),
      lastModified: new Date(),
      changeFrequency,
      priority,
    })
  );

  const songEntries: MetadataRoute.Sitemap = songs.map((song) => ({
    url: absoluteUrl(`/songs/${encodeURIComponent(song.id)}`),
    lastModified: new Date("createdAt" in song && song.createdAt ? song.createdAt : Date.now()),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const sermonEntries: MetadataRoute.Sitemap = sermons.map((sermon) => ({
    url: absoluteUrl(`/sermons/${encodeURIComponent(sermon.id)}`),
    lastModified: new Date(sermon.dateCreated ?? Date.now()),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
    url: absoluteUrl(`/articles/${encodeURIComponent(article.id)}`),
    lastModified: new Date(article.dateCreated ?? Date.now()),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const allEvents = [...eventsGrouped.upcoming, ...eventsGrouped.past];
  const eventEntries: MetadataRoute.Sitemap = allEvents.map((event) => ({
    url: absoluteUrl(`/events/${encodeURIComponent(event.id)}`),
    lastModified: event.updatedAt ? new Date(event.updatedAt) : new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const donationEntries: MetadataRoute.Sitemap = campaigns.map((campaign) => ({
    url: absoluteUrl(`/donations/${encodeURIComponent(campaign.id)}`),
    lastModified: campaign.updatedAt ? new Date(campaign.updatedAt) : new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const bookEntries: MetadataRoute.Sitemap = books
    .filter((book) => book.visibility === "public")
    .map((book) => ({
      url: absoluteUrl(`/books/${encodeURIComponent(book.id)}`),
      lastModified: new Date(book.updatedAt),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  return [
    ...staticEntries,
    ...songEntries,
    ...sermonEntries,
    ...articleEntries,
    ...eventEntries,
    ...donationEntries,
    ...bookEntries,
  ];
}
