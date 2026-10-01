import "server-only";

import { getArticleById, getEventById, getSermonById, getSongById } from "@/lib/postgres/features";
import { getChurchVideoById } from "@/lib/postgres/church-videos";
import { getDonationCampaignById } from "@/lib/postgres/features";
import { isSongPublished } from "@/lib/song-firestore";
import type { FirebaseArticle } from "@/types/firebase-article";
import type { FirebaseDonationCampaign } from "@/types/firebase-donation";
import type { FirebaseEvent } from "@/types/firebase-event";
import type { FirebaseSermon } from "@/types/firebase-sermon";
import type { ChurchVideo } from "@/types/church-video";
import type { FirebaseSong } from "@/types/firebase-song";

function belongsToChurch(
  record:
    | {
        churchId?: string | null;
        organizationId?: string | null;
        contentScope?: string | null;
      }
    | null
    | undefined,
  churchId: string,
  organizationId: string
): boolean {
  if (!record) return false;
  if (record.contentScope === "platform_public") return false;
  return (
    record.churchId?.trim() === churchId &&
    record.organizationId?.trim() === organizationId
  );
}

export async function getPublishedSongForChurch(
  songId: string,
  churchId: string,
  organizationId: string
): Promise<FirebaseSong | null> {
  const song = await getSongById(songId);
  if (!song || !isSongPublished(song)) return null;
  if (!belongsToChurch(song, churchId, organizationId)) return null;
  return song;
}

export async function getPublishedSermonForChurch(
  sermonId: string,
  churchId: string,
  organizationId: string
): Promise<FirebaseSermon | null> {
  const sermon = await getSermonById(sermonId);
  if (!sermon?.isPublished) return null;
  if (!belongsToChurch(sermon, churchId, organizationId)) return null;
  return sermon;
}

export async function getPublishedEventForChurch(
  eventId: string,
  churchId: string,
  organizationId: string
): Promise<FirebaseEvent | null> {
  const event = await getEventById(eventId);
  if (!event || event.status !== "published") return null;
  if (!belongsToChurch(event, churchId, organizationId)) return null;
  return event;
}

export async function getPublishedArticleForChurch(
  articleId: string,
  churchId: string,
  organizationId: string
): Promise<FirebaseArticle | null> {
  const article = await getArticleById(articleId);
  if (!article?.isPublished) return null;
  if (!belongsToChurch(article, churchId, organizationId)) return null;
  return article;
}

export async function getPublishedVideoForChurch(
  videoId: string,
  churchId: string,
  organizationId: string
): Promise<ChurchVideo | null> {
  const row = await getChurchVideoById(videoId);
  if (!row?.published) return null;
  if (!belongsToChurch(row, churchId, organizationId)) return null;
  return {
    id: row.id,
    organizationId: row.organizationId ?? "",
    churchId: row.churchId ?? "",
    title: row.title,
    description: row.description,
    externalUrl: row.externalUrl,
    provider: row.provider as ChurchVideo["provider"],
    thumbnailUrl: row.thumbnailUrl,
    category: row.category as ChurchVideo["category"],
    tags: row.tags ?? [],
    published: row.published,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getActiveCampaignForChurch(
  campaignId: string,
  churchId: string,
  organizationId: string
): Promise<FirebaseDonationCampaign | null> {
  const campaign = await getDonationCampaignById(campaignId);
  if (!campaign || campaign.status !== "active") return null;
  if (!belongsToChurch(campaign, churchId, organizationId)) return null;
  return campaign;
}
