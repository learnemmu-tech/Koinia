import type { MetadataRoute } from "next";

import { getPageTenantContext } from "@/lib/church-page-data";
import { getActiveDonationCampaignsCached } from "@/lib/cached-donation-data";
import { getPublishedEventsGroupedCached } from "@/lib/cached-event-data";
import {
  getPublishedArticlesCached,
  getPublishedSermonsCached,
  getPublishedSongsCached,
} from "@/lib/cached-worship-data";
import { STATIC_SITEMAP_PATHS } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { scope } = await getPageTenantContext();

  const [songs, sermons, articles, eventsGrouped, campaigns] = await Promise.all([
    getPublishedSongsCached(scope).catch(() => []),
    getPublishedSermonsCached(scope).catch(() => []),
    getPublishedArticlesCached(scope).catch(() => []),
    getPublishedEventsGroupedCached(scope).catch(() => ({
      upcoming: [],
      past: [],
    })),
    getActiveDonationCampaignsCached(scope).catch(() => []),
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

  return [
    ...staticEntries,
    ...songEntries,
    ...sermonEntries,
    ...articleEntries,
    ...eventEntries,
    ...donationEntries,
  ];
}
