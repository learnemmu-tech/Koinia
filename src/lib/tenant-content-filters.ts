import type { FirebaseArticle } from "@/types/firebase-article";
import type { FirebaseDonationCampaign } from "@/types/firebase-donation";
import type { FirebaseEvent } from "@/types/firebase-event";
import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";
import type { FirebaseSermon } from "@/types/firebase-sermon";
import type { FirebaseSong } from "@/types/firebase-song";

import { filterPublishedEvents } from "@/lib/event-firestore";
import { isPublicPrayerRequest } from "@/lib/prayer-request-firestore";
import { filterPublishedSongs, isSongPublished } from "@/lib/song-firestore";

import type { CollectionName } from "./tenant-content-types";

export function filterTenantContentItems<T>(
  collection: CollectionName,
  items: T[],
  canManage: boolean
): T[] {
  if (canManage) return items;

  switch (collection) {
    case "songs":
      return filterPublishedSongs(items as FirebaseSong[]) as T[];
    case "sermons":
      return (items as FirebaseSermon[]).filter((item) => item.isPublished) as T[];
    case "articles":
      return (items as FirebaseArticle[]).filter((item) => item.isPublished) as T[];
    case "events":
      return filterPublishedEvents(items as FirebaseEvent[]) as T[];
    case "prayerRequests":
      return (items as FirebasePrayerRequest[]).filter(
        (request) =>
          request.status === "approved" && isPublicPrayerRequest(request)
      ) as T[];
    case "donationCampaigns":
      return (items as FirebaseDonationCampaign[]).filter(
        (campaign) => campaign.status === "active"
      ) as T[];
    default:
      return items;
  }
}

export function filterTenantContentItemById<T extends { churchId?: string }>(
  collection: CollectionName,
  item: T | null | undefined,
  canManage: boolean
): T | null {
  if (!item) return null;
  return filterTenantContentItems(collection, [item], canManage)[0] ?? null;
}

export function isPublishedSongItem(item: FirebaseSong): boolean {
  return isSongPublished(item);
}

export function isPublishedSermonItem(item: FirebaseSermon): boolean {
  return item.isPublished;
}

export function isPublishedArticleItem(item: FirebaseArticle): boolean {
  return item.isPublished;
}

export function isPublishedEventItem(item: FirebaseEvent): boolean {
  return item.status === "published";
}

export function filterTenantContentByIds<T>(
  collection: CollectionName,
  items: T[],
  canManage: boolean
): T[] {
  return filterTenantContentItems(collection, items, canManage);
}
