import "server-only";

import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  articles,
  churchMemberships,
  churches,
  donationCampaigns,
  donations,
  eventRegistrations,
  events,
  favorites,
  notificationReads,
  notifications,
  organizationMemberships,
  prayerIntercessions,
  prayerRequests,
  recentlyViewed,
  sermons,
  songs,
  users,
} from "@/db/schema";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import {
  mapArticle,
  mapDonation,
  mapDonationCampaign,
  mapEvent,
  mapNotification,
  mapPrayerIntercession,
  mapPrayerRequest,
  mapSermon,
  mapSong,
} from "@/lib/postgres/mappers";
import { getClerkIdByUserId, getClerkIdsByUserIds } from "@/lib/postgres/session";
import { getChurchRowById } from "@/lib/postgres/tenants";
import { isPostgresUuid, postgresUuidOrEmpty } from "@/lib/postgres/uuid";
import type { CreateArticleInput, FirebaseArticle, UpdateArticleInput } from "@/types/firebase-article";
import type {
  CreateDonationCampaignInput,
  DonationCurrency,
  FirebaseDonation,
  FirebaseDonationCampaign,
  PaymentProviderId,
  UpdateDonationCampaignInput,
} from "@/types/firebase-donation";
import type { CreateEventInput, FirebaseEvent, UpdateEventInput } from "@/types/firebase-event";
import type { FavoriteItemType, FirebaseFavorite } from "@/types/firebase-favorite";
import type { NotificationContentType, FirebaseNotification } from "@/types/firebase-notification";
import { roleMeetsMinimum, type MembershipRole } from "@/types/membership";
import type {
  CreatePrayerRequestInput,
  FirebasePrayerIntercession,
  FirebasePrayerRequest,
  UpdatePrayerRequestInput,
} from "@/types/firebase-prayer-request";
import type {
  FirebaseRecentlyViewed,
  RecentlyViewedItemType,
} from "@/types/firebase-recently-viewed";
import type {
  CreateSermonInput,
  FirebaseSermon,
  UpdateSermonInput,
} from "@/types/firebase-sermon";
import type { CreateSongInput, FirebaseSong, UpdateSongInput } from "@/types/firebase-song";
import type { TenantScope } from "@/lib/organization/tenant-scope";
import type { SubscriptionUsage } from "@/types/subscription";
import { EMPTY_USAGE } from "@/lib/subscription/limits";

const NOTIFICATION_PRESETS: Record<
  NotificationContentType,
  { title: string; message: string }
> = {
  song: {
    title: "New Song Added",
    message: "A new worship song has been added.",
  },
  article: {
    title: "New Article Published",
    message: "A new article is available to read.",
  },
  sermon: {
    title: "New Sermon Added",
    message: "A new sermon has been published.",
  },
  event: {
    title: "New Event Published",
    message: "A new ministry event is available.",
  },
  prayer: {
    title: "Prayer Request Approved",
    message: "A prayer request is now on the prayer wall.",
  },
  prayer_request_submitted: {
    title: "New Prayer Request",
    message: "A member submitted a prayer request for review.",
  },
  membership_approved: {
    title: "Membership Approved",
    message: "Your church membership has been approved.",
  },
};

export type PendingDonationInput = {
  campaignId: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  currency: DonationCurrency;
  isAnonymous: boolean;
  paymentProvider: PaymentProviderId;
  idempotencyKey?: string;
};

async function requireChurch(churchId: string) {
  const church = await getChurchRowById(churchId);
  if (!church) throw new Error("Church not found");
  return church;
}

function scopeChurchId(scope: Partial<TenantScope>): string {
  return (
    postgresUuidOrEmpty(scope.churchId) ||
    postgresUuidOrEmpty(scope.branchId)
  );
}

export async function listSongs(scope: Partial<TenantScope>): Promise<FirebaseSong[]> {
  const churchId = scopeChurchId(scope);
  if (!churchId) return [];
  const rows = await db
    .select()
    .from(songs)
    .where(eq(songs.churchId, churchId))
    .orderBy(desc(songs.createdAt));
  return rows.map(mapSong);
}

export async function getSongById(songId: string): Promise<FirebaseSong | null> {
  if (!isPostgresUuid(songId)) return null;
  const [row] = await db.select().from(songs).where(eq(songs.id, songId)).limit(1);
  return row ? mapSong(row) : null;
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids.map((id) => id.trim()).filter(isPostgresUuid))];
}

export async function getSongsByIds(ids: string[]): Promise<FirebaseSong[]> {
  const unique = uniqueIds(ids);
  if (unique.length === 0) return [];
  const rows = await db.select().from(songs).where(inArray(songs.id, unique));
  return rows.map(mapSong);
}

export async function addSong(
  churchId: string,
  input: CreateSongInput
): Promise<string> {
  const church = await requireChurch(churchId);
  const [row] = await db
    .insert(songs)
    .values({
      organizationId: church.organizationId,
      churchId: church.id,
      songTitle: input.songTitle.trim(),
      alternateTitle: input.alternateTitle?.trim() || null,
      artist: input.artist?.trim() || null,
      category: input.category ?? "Worship",
      originalLyrics: input.originalLyrics ?? "",
      translationLyrics: input.translationLyrics?.trim() || null,
      scriptureReference: input.scriptureReference?.trim() || null,
      tags: input.tags ?? [],
      featured: input.featured ?? false,
      published: input.published ?? true,
      imageUrl: input.imageUrl?.trim() || null,
      audioUrl: input.audioUrl?.trim() || null,
      youtubeUrl: input.youtubeUrl?.trim() || null,
    })
    .returning({ id: songs.id });
  if (!row) throw new Error("Failed to create song");
  return row.id;
}

export async function updateSong(songId: string, updates: UpdateSongInput): Promise<void> {
  const patch: Partial<typeof songs.$inferInsert> = { updatedAt: new Date() };
  if (updates.songTitle !== undefined) patch.songTitle = updates.songTitle.trim();
  if (updates.alternateTitle !== undefined) {
    patch.alternateTitle = updates.alternateTitle.trim() || null;
  }
  if (updates.artist !== undefined) patch.artist = updates.artist.trim() || null;
  if (updates.category !== undefined) patch.category = updates.category;
  if (updates.originalLyrics !== undefined) patch.originalLyrics = updates.originalLyrics;
  if (updates.translationLyrics !== undefined) {
    patch.translationLyrics = updates.translationLyrics.trim() || null;
  }
  if (updates.scriptureReference !== undefined) {
    patch.scriptureReference = updates.scriptureReference.trim() || null;
  }
  if (updates.tags !== undefined) patch.tags = updates.tags;
  if (updates.featured !== undefined) patch.featured = updates.featured;
  if (updates.published !== undefined) patch.published = updates.published;
  if (updates.imageUrl !== undefined) patch.imageUrl = updates.imageUrl.trim() || null;
  if (updates.audioUrl !== undefined) patch.audioUrl = updates.audioUrl.trim() || null;
  if (updates.youtubeUrl !== undefined) patch.youtubeUrl = updates.youtubeUrl.trim() || null;
  await db.update(songs).set(patch).where(eq(songs.id, songId));
}

export async function deleteSong(songId: string): Promise<void> {
  await db.delete(songs).where(eq(songs.id, songId));
}

export async function incrementPlayCount(songId: string): Promise<void> {
  await db
    .update(songs)
    .set({ playCount: sql`${songs.playCount} + 1` })
    .where(eq(songs.id, songId));
}

export async function listSermons(scope: Partial<TenantScope>): Promise<FirebaseSermon[]> {
  const churchId = scopeChurchId(scope);
  if (!churchId) return [];
  const rows = await db
    .select()
    .from(sermons)
    .where(eq(sermons.churchId, churchId))
    .orderBy(desc(sermons.createdAt));
  const clerkIds = await getClerkIdsByUserIds(
    rows.map((row) => row.createdBy).filter((id): id is string => Boolean(id))
  );
  return rows.map((row) =>
    mapSermon(row, row.createdBy ? clerkIds.get(row.createdBy) ?? "" : "")
  );
}

export async function getSermonById(sermonId: string): Promise<FirebaseSermon | null> {
  const [row] = await db.select().from(sermons).where(eq(sermons.id, sermonId)).limit(1);
  if (!row) return null;
  const clerkId = row.createdBy ? await getClerkIdByUserId(row.createdBy) : "";
  return mapSermon(row, clerkId ?? "");
}

export async function getSermonsByIds(ids: string[]): Promise<FirebaseSermon[]> {
  const unique = uniqueIds(ids);
  if (unique.length === 0) return [];
  const rows = await db.select().from(sermons).where(inArray(sermons.id, unique));
  const clerkIds = await getClerkIdsByUserIds(
    rows.map((row) => row.createdBy).filter((id): id is string => Boolean(id))
  );
  return rows.map((row) =>
    mapSermon(row, row.createdBy ? clerkIds.get(row.createdBy) ?? "" : "")
  );
}

export async function createSermon(input: CreateSermonInput): Promise<string> {
  const church = await requireChurch(input.churchId);
  const creator = input.createdBy ? await getAppUserByClerkId(input.createdBy) : null;
  const [row] = await db
    .insert(sermons)
    .values({
      organizationId: church.organizationId,
      churchId: church.id,
      title: input.title.trim(),
      subtitle: input.subtitle?.trim() || null,
      scriptureReference: input.scriptureReference ?? "",
      speaker: input.speaker ?? "",
      shortDescription: input.shortDescription ?? "",
      content: input.content ?? "",
      tags: input.tags ?? [],
      youtubeUrl: input.youtubeUrl?.trim() || null,
      audioUrl: input.audioUrl?.trim() || null,
      coverImage: input.coverImage?.trim() || null,
      createdBy: creator?.id ?? null,
      isPublished: input.isPublished,
    })
    .returning({ id: sermons.id });
  if (!row) throw new Error("Failed to create sermon");
  return row.id;
}

export async function updateSermon(sermonId: string, updates: UpdateSermonInput): Promise<void> {
  const patch: Partial<typeof sermons.$inferInsert> = { updatedAt: new Date() };
  if (updates.title !== undefined) patch.title = updates.title.trim();
  if (updates.subtitle !== undefined) patch.subtitle = updates.subtitle.trim() || null;
  if (updates.scriptureReference !== undefined) {
    patch.scriptureReference = updates.scriptureReference;
  }
  if (updates.speaker !== undefined) patch.speaker = updates.speaker;
  if (updates.shortDescription !== undefined) patch.shortDescription = updates.shortDescription;
  if (updates.content !== undefined) patch.content = updates.content;
  if (updates.tags !== undefined) patch.tags = updates.tags;
  if (updates.youtubeUrl !== undefined) patch.youtubeUrl = updates.youtubeUrl.trim() || null;
  if (updates.audioUrl !== undefined) patch.audioUrl = updates.audioUrl.trim() || null;
  if (updates.coverImage !== undefined) patch.coverImage = updates.coverImage.trim() || null;
  if (updates.isPublished !== undefined) patch.isPublished = updates.isPublished;
  await db.update(sermons).set(patch).where(eq(sermons.id, sermonId));
}

export async function deleteSermon(sermonId: string): Promise<void> {
  await db.delete(sermons).where(eq(sermons.id, sermonId));
}

export async function listArticles(scope: Partial<TenantScope>): Promise<FirebaseArticle[]> {
  const churchId = scopeChurchId(scope);
  if (!churchId) return [];
  const rows = await db
    .select()
    .from(articles)
    .where(eq(articles.churchId, churchId))
    .orderBy(desc(articles.createdAt));
  const clerkIds = await getClerkIdsByUserIds(
    rows.map((row) => row.createdBy).filter((id): id is string => Boolean(id))
  );
  return rows.map((row) =>
    mapArticle(row, row.createdBy ? clerkIds.get(row.createdBy) ?? "" : "")
  );
}

export async function getArticleById(articleId: string): Promise<FirebaseArticle | null> {
  const [row] = await db.select().from(articles).where(eq(articles.id, articleId)).limit(1);
  if (!row) return null;
  const clerkId = row.createdBy ? await getClerkIdByUserId(row.createdBy) : "";
  return mapArticle(row, clerkId ?? "");
}

export async function getArticlesByIds(ids: string[]): Promise<FirebaseArticle[]> {
  const unique = uniqueIds(ids);
  if (unique.length === 0) return [];
  const rows = await db.select().from(articles).where(inArray(articles.id, unique));
  const clerkIds = await getClerkIdsByUserIds(
    rows.map((row) => row.createdBy).filter((id): id is string => Boolean(id))
  );
  return rows.map((row) =>
    mapArticle(row, row.createdBy ? clerkIds.get(row.createdBy) ?? "" : "")
  );
}

export async function createArticle(input: CreateArticleInput): Promise<string> {
  const church = await requireChurch(input.churchId);
  const creator = input.createdBy ? await getAppUserByClerkId(input.createdBy) : null;
  const [row] = await db
    .insert(articles)
    .values({
      organizationId: church.organizationId,
      churchId: church.id,
      title: input.title.trim(),
      category: input.category || "Christian Living",
      shortDescription: input.shortDescription ?? "",
      scriptureReference: input.scriptureReference?.trim() || null,
      content: input.content ?? "",
      coverImage: input.coverImage?.trim() || null,
      author: input.author ?? "",
      tags: input.tags ?? [],
      youtubeUrl: input.youtubeUrl?.trim() || null,
      featured: input.featured ?? false,
      createdBy: creator?.id ?? null,
      isPublished: input.isPublished,
    })
    .returning({ id: articles.id });
  if (!row) throw new Error("Failed to create article");
  return row.id;
}

export async function updateArticle(articleId: string, updates: UpdateArticleInput): Promise<void> {
  const patch: Partial<typeof articles.$inferInsert> = { updatedAt: new Date() };
  if (updates.title !== undefined) patch.title = updates.title.trim();
  if (updates.category !== undefined) patch.category = updates.category;
  if (updates.shortDescription !== undefined) patch.shortDescription = updates.shortDescription;
  if (updates.scriptureReference !== undefined) {
    patch.scriptureReference = updates.scriptureReference.trim() || null;
  }
  if (updates.content !== undefined) patch.content = updates.content;
  if (updates.coverImage !== undefined) patch.coverImage = updates.coverImage.trim() || null;
  if (updates.author !== undefined) patch.author = updates.author;
  if (updates.tags !== undefined) patch.tags = updates.tags;
  if (updates.youtubeUrl !== undefined) patch.youtubeUrl = updates.youtubeUrl.trim() || null;
  if (updates.featured !== undefined) patch.featured = updates.featured;
  if (updates.isPublished !== undefined) patch.isPublished = updates.isPublished;
  await db.update(articles).set(patch).where(eq(articles.id, articleId));
}

export async function deleteArticle(articleId: string): Promise<void> {
  await db.delete(articles).where(eq(articles.id, articleId));
}

export async function listEvents(scope: Partial<TenantScope>): Promise<FirebaseEvent[]> {
  const churchId = scopeChurchId(scope);
  if (!churchId) return [];
  const rows = await db
    .select()
    .from(events)
    .where(eq(events.churchId, churchId))
    .orderBy(desc(events.eventDate));
  return rows.map(mapEvent);
}

export async function getEventById(eventId: string): Promise<FirebaseEvent | null> {
  const [row] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  return row ? mapEvent(row) : null;
}

export async function getEventsByIds(ids: string[]): Promise<FirebaseEvent[]> {
  const unique = uniqueIds(ids);
  if (unique.length === 0) return [];
  const rows = await db.select().from(events).where(inArray(events.id, unique));
  return rows.map(mapEvent);
}

export async function createEvent(input: CreateEventInput): Promise<string> {
  const church = await requireChurch(input.churchId);
  const [row] = await db
    .insert(events)
    .values({
      organizationId: church.organizationId,
      churchId: church.id,
      title: input.title.trim(),
      description: input.description ?? "",
      bannerImage: input.bannerImage?.trim() || null,
      eventType: input.eventType,
      speakerName: input.speakerName ?? "",
      eventDate: input.eventDate,
      eventTime: input.eventTime ?? "",
      location: input.location ?? "",
      status: input.status,
    })
    .returning({ id: events.id });
  if (!row) throw new Error("Failed to create event");
  return row.id;
}

export async function updateEvent(eventId: string, updates: UpdateEventInput): Promise<void> {
  const patch: Partial<typeof events.$inferInsert> = { updatedAt: new Date() };
  if (updates.title !== undefined) patch.title = updates.title.trim();
  if (updates.description !== undefined) patch.description = updates.description;
  if (updates.bannerImage !== undefined) patch.bannerImage = updates.bannerImage.trim() || null;
  if (updates.eventType !== undefined) patch.eventType = updates.eventType;
  if (updates.speakerName !== undefined) patch.speakerName = updates.speakerName;
  if (updates.eventDate !== undefined) patch.eventDate = updates.eventDate;
  if (updates.eventTime !== undefined) patch.eventTime = updates.eventTime;
  if (updates.location !== undefined) patch.location = updates.location;
  if (updates.status !== undefined) patch.status = updates.status;
  await db.update(events).set(patch).where(eq(events.id, eventId));
}

export async function deleteEvent(eventId: string): Promise<void> {
  await db.delete(events).where(eq(events.id, eventId));
}

export async function registerUserForEvent(input: {
  eventId: string;
  userId: string;
  userEmail: string;
  userName: string;
}): Promise<{ ok: true; alreadyRegistered: boolean } | { ok: false; error: string }> {
  const event = await getEventById(input.eventId);
  if (!event) return { ok: false, error: "Event not found." };
  if (event.status !== "published") {
    return { ok: false, error: "This event is not open for registration." };
  }
  const appUser = await getAppUserByClerkId(input.userId);
  if (!appUser) return { ok: false, error: "Application user not found." };
  const church = await requireChurch(event.churchId);

  const [existing] = await db
    .select({ id: eventRegistrations.id })
    .from(eventRegistrations)
    .where(
      and(
        eq(eventRegistrations.eventId, input.eventId),
        eq(eventRegistrations.userId, appUser.id)
      )
    )
    .limit(1);
  if (existing) return { ok: true, alreadyRegistered: true };

  await db.insert(eventRegistrations).values({
    organizationId: church.organizationId,
    churchId: church.id,
    eventId: input.eventId,
    userId: appUser.id,
    userEmail: input.userEmail.trim(),
    userName: input.userName.trim() || "Guest",
  });
  return { ok: true, alreadyRegistered: false };
}

export async function listPrayerRequests(
  scope: Partial<TenantScope>
): Promise<FirebasePrayerRequest[]> {
  const churchId = scopeChurchId(scope);
  if (!churchId) return [];
  const rows = await db
    .select()
    .from(prayerRequests)
    .where(eq(prayerRequests.churchId, churchId))
    .orderBy(desc(prayerRequests.createdAt));
  const clerkIds = await getClerkIdsByUserIds(
    rows.map((row) => row.userId).filter((id): id is string => Boolean(id))
  );
  return rows.map((row) =>
    mapPrayerRequest(row, row.userId ? clerkIds.get(row.userId) : null)
  );
}

export async function getPrayerRequestById(
  requestId: string
): Promise<FirebasePrayerRequest | null> {
  const [row] = await db
    .select()
    .from(prayerRequests)
    .where(eq(prayerRequests.id, requestId))
    .limit(1);
  if (!row) return null;
  const clerkId = row.userId ? await getClerkIdByUserId(row.userId) : null;
  return mapPrayerRequest(row, clerkId);
}

export async function createPrayerRequest(input: CreatePrayerRequestInput): Promise<string> {
  const church = await requireChurch(input.churchId);
  const appUser = input.userId ? await getAppUserByClerkId(input.userId) : null;
  const [row] = await db
    .insert(prayerRequests)
    .values({
      organizationId: church.organizationId,
      churchId: church.id,
      userId: appUser?.id ?? null,
      name: input.name.trim(),
      email: input.email?.trim() || null,
      title: input.title.trim(),
      request: input.request,
      category: input.category,
      isAnonymous: input.isAnonymous,
      shareWithCommunity: input.shareWithCommunity,
      status: "pending",
    })
    .returning({ id: prayerRequests.id });
  if (!row) throw new Error("Failed to create prayer request");
  return row.id;
}

export async function updatePrayerRequest(
  requestId: string,
  updates: UpdatePrayerRequestInput
): Promise<void> {
  const patch: Partial<typeof prayerRequests.$inferInsert> = { updatedAt: new Date() };
  if (updates.status !== undefined) patch.status = updates.status;
  if (updates.prayerCount !== undefined) patch.prayerCount = updates.prayerCount;
  if (updates.isAnswered !== undefined) patch.isAnswered = updates.isAnswered;
  if (updates.answeredAt !== undefined) {
    patch.answeredAt = updates.answeredAt ? new Date(updates.answeredAt) : null;
  }
  await db.update(prayerRequests).set(patch).where(eq(prayerRequests.id, requestId));
}

export async function deletePrayerRequest(requestId: string): Promise<void> {
  await db.delete(prayerRequests).where(eq(prayerRequests.id, requestId));
}

export async function recordPrayerIntercession(
  requestId: string,
  clerkId: string
): Promise<FirebasePrayerIntercession> {
  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser) throw new Error("Application user not found.");

  const [existing] = await db
    .select()
    .from(prayerIntercessions)
    .where(
      and(
        eq(prayerIntercessions.prayerRequestId, requestId),
        eq(prayerIntercessions.userId, appUser.id)
      )
    )
    .limit(1);
  if (existing) return mapPrayerIntercession(existing, clerkId);

  const [row] = await db
    .insert(prayerIntercessions)
    .values({
      prayerRequestId: requestId,
      userId: appUser.id,
    })
    .returning();
  if (!row) throw new Error("Failed to record prayer");

  await db
    .update(prayerRequests)
    .set({ prayerCount: sql`${prayerRequests.prayerCount} + 1`, updatedAt: new Date() })
    .where(eq(prayerRequests.id, requestId));

  return mapPrayerIntercession(row, clerkId);
}

export async function listUserIntercessions(
  clerkId: string
): Promise<FirebasePrayerIntercession[]> {
  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser) return [];
  const rows = await db
    .select()
    .from(prayerIntercessions)
    .where(eq(prayerIntercessions.userId, appUser.id));
  return rows.map((row) => mapPrayerIntercession(row, clerkId));
}

export async function listDonationCampaigns(
  scope: Partial<TenantScope>
): Promise<FirebaseDonationCampaign[]> {
  const churchId = scopeChurchId(scope);
  if (!churchId) return [];
  const rows = await db
    .select()
    .from(donationCampaigns)
    .where(eq(donationCampaigns.churchId, churchId))
    .orderBy(desc(donationCampaigns.createdAt));
  return rows.map(mapDonationCampaign);
}

export async function getDonationCampaignById(
  campaignId: string
): Promise<FirebaseDonationCampaign | null> {
  const [row] = await db
    .select()
    .from(donationCampaigns)
    .where(eq(donationCampaigns.id, campaignId))
    .limit(1);
  return row ? mapDonationCampaign(row) : null;
}

export async function createDonationCampaign(
  input: CreateDonationCampaignInput
): Promise<string> {
  const church = await requireChurch(input.churchId);
  const [row] = await db
    .insert(donationCampaigns)
    .values({
      organizationId: church.organizationId,
      churchId: church.id,
      title: input.title.trim(),
      description: input.description ?? "",
      bannerImage: input.bannerImage?.trim() || null,
      targetAmount: String(input.targetAmount ?? 0),
      currency: input.currency,
      status: input.status,
    })
    .returning({ id: donationCampaigns.id });
  if (!row) throw new Error("Failed to create campaign");
  return row.id;
}

export async function updateDonationCampaign(
  campaignId: string,
  updates: UpdateDonationCampaignInput
): Promise<void> {
  const patch: Partial<typeof donationCampaigns.$inferInsert> = { updatedAt: new Date() };
  if (updates.title !== undefined) patch.title = updates.title.trim();
  if (updates.description !== undefined) patch.description = updates.description;
  if (updates.bannerImage !== undefined) patch.bannerImage = updates.bannerImage.trim() || null;
  if (updates.targetAmount !== undefined) patch.targetAmount = String(updates.targetAmount);
  if (updates.currency !== undefined) patch.currency = updates.currency;
  if (updates.status !== undefined) patch.status = updates.status;
  await db.update(donationCampaigns).set(patch).where(eq(donationCampaigns.id, campaignId));
}

export async function deleteDonationCampaign(campaignId: string): Promise<void> {
  await db.delete(donationCampaigns).where(eq(donationCampaigns.id, campaignId));
}

export async function listDonations(scope: Partial<TenantScope>): Promise<FirebaseDonation[]> {
  const churchId = scopeChurchId(scope);
  if (!churchId) return [];
  const rows = await db
    .select()
    .from(donations)
    .where(eq(donations.churchId, churchId))
    .orderBy(desc(donations.createdAt));
  return rows.map(mapDonation);
}

export async function getDonationById(donationId: string): Promise<FirebaseDonation | null> {
  const [row] = await db.select().from(donations).where(eq(donations.id, donationId)).limit(1);
  return row ? mapDonation(row) : null;
}

export async function listDonationsByEmail(email: string): Promise<FirebaseDonation[]> {
  const rows = await db
    .select()
    .from(donations)
    .where(eq(donations.donorEmail, email.trim().toLowerCase()))
    .orderBy(desc(donations.createdAt));
  return rows.map(mapDonation);
}

export async function createPendingDonation(input: PendingDonationInput): Promise<string> {
  const campaign = await getDonationCampaignById(input.campaignId);
  if (!campaign) throw new Error("Campaign not found");
  const church = await requireChurch(campaign.churchId);
  const [row] = await db
    .insert(donations)
    .values({
      organizationId: church.organizationId,
      churchId: church.id,
      campaignId: campaign.id,
      donorName: input.donorName.trim(),
      donorEmail: input.donorEmail.trim().toLowerCase(),
      amount: String(input.amount),
      currency: input.currency,
      paymentStatus: "pending",
      paymentProvider: input.paymentProvider,
      transactionId: input.idempotencyKey?.trim() || `pending_${Date.now()}`,
      isAnonymous: input.isAnonymous,
    })
    .returning({ id: donations.id });
  if (!row) throw new Error("Failed to create donation");
  return row.id;
}

export async function completeDonationPayment(input: {
  donationId: string;
  transactionId: string;
}): Promise<FirebaseDonation | null> {
  const [existing] = await db
    .select()
    .from(donations)
    .where(eq(donations.id, input.donationId))
    .limit(1);
  if (!existing) return null;

  const [updated] = await db
    .update(donations)
    .set({
      paymentStatus: "completed",
      transactionId: input.transactionId,
    })
    .where(eq(donations.id, input.donationId))
    .returning();

  if (updated) {
    await db
      .update(donationCampaigns)
      .set({
        currentAmount: sql`${donationCampaigns.currentAmount} + ${existing.amount}`,
        updatedAt: new Date(),
      })
      .where(eq(donationCampaigns.id, existing.campaignId));
  }

  return updated ? mapDonation(updated) : null;
}

export async function listUserNotifications(
  clerkId: string
): Promise<FirebaseNotification[]> {
  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser) return [];
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, appUser.id))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
  const reads = await db
    .select()
    .from(notificationReads)
    .where(eq(notificationReads.userId, appUser.id));
  const readIds = new Set(reads.map((row) => row.notificationId));
  return rows.map((row) => mapNotification(row, clerkId, readIds.has(row.id)));
}

export async function markNotificationRead(
  clerkId: string,
  notificationId: string
): Promise<void> {
  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser) return;
  await db
    .insert(notificationReads)
    .values({ notificationId, userId: appUser.id })
    .onConflictDoNothing();
}

export async function markAllNotificationsRead(
  clerkId: string,
  notificationIds: string[]
): Promise<void> {
  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser || notificationIds.length === 0) return;
  await db
    .insert(notificationReads)
    .values(notificationIds.map((notificationId) => ({ notificationId, userId: appUser.id })))
    .onConflictDoNothing();
}

export async function createPublishNotifications(input: {
  type: NotificationContentType;
  contentId: string;
  contentTitle: string;
  image?: string;
  organizationId?: string;
  churchId?: string;
}): Promise<string | null> {
  const churchId = input.churchId?.trim();
  if (!churchId || !input.contentId.trim()) return null;
  const church = await getChurchRowById(churchId);
  if (!church) return null;

  const members = await db
    .select({ userId: churchMemberships.userId })
    .from(churchMemberships)
    .where(
      and(
        eq(churchMemberships.churchId, churchId),
        eq(churchMemberships.status, "active")
      )
    );
  if (members.length === 0) return null;

  const preset = NOTIFICATION_PRESETS[input.type] ?? NOTIFICATION_PRESETS.song;
  const inserted = await db
    .insert(notifications)
    .values(
      members.map((member) => ({
        organizationId: church.organizationId,
        churchId,
        userId: member.userId,
        type: input.type,
        title: preset.title,
        message: preset.message,
        contentTitle: input.contentTitle.trim(),
        image: input.image?.trim() || null,
        contentId: input.contentId,
      }))
    )
    .returning({ id: notifications.id });
  return inserted[0]?.id ?? null;
}

export async function listFavorites(clerkId: string): Promise<FirebaseFavorite[]> {
  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser) return [];
  const rows = await db
    .select()
    .from(favorites)
    .where(eq(favorites.userId, appUser.id))
    .orderBy(desc(favorites.createdAt));
  return rows.map((row) => ({
    id: row.id,
    userId: clerkId,
    itemId: row.itemId,
    itemType: row.itemType,
    createdAt: row.createdAt.getTime(),
  }));
}

export async function addFavorite(
  clerkId: string,
  itemType: FavoriteItemType,
  itemId: string
): Promise<void> {
  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser) throw new Error("Application user not found.");
  await db
    .insert(favorites)
    .values({ userId: appUser.id, itemType, itemId })
    .onConflictDoNothing();
}

export async function removeFavorite(
  clerkId: string,
  itemType: FavoriteItemType,
  itemId: string
): Promise<void> {
  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser) return;
  await db
    .delete(favorites)
    .where(
      and(
        eq(favorites.userId, appUser.id),
        eq(favorites.itemType, itemType),
        eq(favorites.itemId, itemId)
      )
    );
}

export async function listRecentlyViewed(
  clerkId: string
): Promise<FirebaseRecentlyViewed[]> {
  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser) return [];
  const rows = await db
    .select()
    .from(recentlyViewed)
    .where(eq(recentlyViewed.userId, appUser.id))
    .orderBy(desc(recentlyViewed.viewedAt));
  return rows.map((row) => ({
    id: row.id,
    userId: clerkId,
    itemId: row.itemId,
    itemType: row.itemType,
    viewedAt: row.viewedAt.getTime(),
  }));
}

export async function recordRecentlyViewed(
  clerkId: string,
  itemType: RecentlyViewedItemType,
  itemId: string
): Promise<void> {
  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser) return;
  await db
    .insert(recentlyViewed)
    .values({
      userId: appUser.id,
      itemType,
      itemId,
      viewedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [recentlyViewed.userId, recentlyViewed.itemType, recentlyViewed.itemId],
      set: { viewedAt: new Date() },
    });
}

export async function clearRecentlyViewedHistory(clerkId: string): Promise<void> {
  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser) return;
  await db.delete(recentlyViewed).where(eq(recentlyViewed.userId, appUser.id));
}

export async function computeOrganizationUsage(
  organizationId: string
): Promise<SubscriptionUsage> {
  if (!organizationId.trim()) return { ...EMPTY_USAGE };

  const countWhere = async (
    table:
      | typeof songs
      | typeof sermons
      | typeof articles
      | typeof events
      | typeof donationCampaigns
      | typeof churches
  ) => {
    const [row] = await db
      .select({ value: sql<number>`count(*)::int` })
      .from(table)
      .where(eq(table.organizationId, organizationId));
    return row?.value ?? 0;
  };

  const [membersRow] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(churchMemberships)
    .where(
      and(
        eq(churchMemberships.organizationId, organizationId),
        eq(churchMemberships.status, "active")
      )
    );
  const [adminsRow] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(organizationMemberships)
    .where(
      and(
        eq(organizationMemberships.organizationId, organizationId),
        eq(organizationMemberships.status, "active")
      )
    );

  const [churchAdminRow] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(churchMemberships)
    .where(
      and(
        eq(churchMemberships.organizationId, organizationId),
        eq(churchMemberships.status, "active"),
        eq(churchMemberships.role, "church_admin")
      )
    );

  return {
    members: membersRow?.value ?? 0,
    songs: await countWhere(songs),
    sermons: await countWhere(sermons),
    articles: await countWhere(articles),
    churches: Math.max(1, await countWhere(churches)),
    admins: (adminsRow?.value ?? 0) + (churchAdminRow?.value ?? 0),
    events: await countWhere(events),
    donationCampaigns: await countWhere(donationCampaigns),
  };
}

export async function listPrayerRequestsForClerkUser(
  clerkId: string
): Promise<FirebasePrayerRequest[]> {
  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser) return [];
  const rows = await db
    .select()
    .from(prayerRequests)
    .where(eq(prayerRequests.userId, appUser.id))
    .orderBy(desc(prayerRequests.createdAt));
  return rows.map((row) => mapPrayerRequest(row, clerkId));
}

export async function userHasRegisteredForEvent(
  eventId: string,
  clerkId: string
): Promise<boolean> {
  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser) return false;
  const [row] = await db
    .select({ id: eventRegistrations.id })
    .from(eventRegistrations)
    .where(
      and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.userId, appUser.id)
      )
    )
    .limit(1);
  return Boolean(row);
}

export async function listChurchMembersForAdmin(churchId: string) {
  const rows = await db
    .select({
      userId: users.id,
      clerkId: users.clerkId,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      platformRole: users.platformRole,
      createdAt: users.createdAt,
    })
    .from(churchMemberships)
    .innerJoin(users, eq(users.id, churchMemberships.userId))
    .where(
      and(
        eq(churchMemberships.churchId, churchId),
        eq(churchMemberships.status, "active")
      )
    )
    .orderBy(desc(users.createdAt));
  return rows;
}

export async function listUsersForEmailBroadcast() {
  return db
    .select({
      id: users.id,
      clerkId: users.clerkId,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      emailPreferences: users.emailPreferences,
    })
    .from(users);
}

export async function listChurchAdminAppUsers(
  churchId: string,
  organizationId?: string
): Promise<Array<{ userId: string; clerkId: string | null }>> {
  const admins = new Map<string, { userId: string; clerkId: string | null }>();

  const churchRows = await db
    .select({
      userId: churchMemberships.userId,
      clerkId: users.clerkId,
      role: churchMemberships.role,
    })
    .from(churchMemberships)
    .innerJoin(users, eq(users.id, churchMemberships.userId))
    .where(
      and(
        eq(churchMemberships.churchId, churchId),
        eq(churchMemberships.status, "active")
      )
    );

  for (const row of churchRows) {
    if (roleMeetsMinimum(row.role as MembershipRole, "church_admin")) {
      admins.set(row.userId, { userId: row.userId, clerkId: row.clerkId });
    }
  }

  const orgId = organizationId?.trim();
  if (orgId) {
    const orgRows = await db
      .select({
        userId: organizationMemberships.userId,
        clerkId: users.clerkId,
        role: organizationMemberships.role,
        status: organizationMemberships.status,
      })
      .from(organizationMemberships)
      .innerJoin(users, eq(users.id, organizationMemberships.userId))
      .where(
        and(
          eq(organizationMemberships.organizationId, orgId),
          eq(organizationMemberships.status, "active")
        )
      );

    for (const row of orgRows) {
      admins.set(row.userId, { userId: row.userId, clerkId: row.clerkId });
    }
  }

  return [...admins.values()];
}

export async function createUserNotifications(input: {
  userIds: string[];
  type: NotificationContentType;
  churchId: string;
  organizationId: string;
  title: string;
  message: string;
  contentTitle: string;
  contentId?: string;
  image?: string;
}): Promise<void> {
  const userIds = uniqueIds(input.userIds);
  if (userIds.length === 0 || !input.churchId.trim()) return;

  await db.insert(notifications).values(
    userIds.map((userId) => ({
      organizationId: input.organizationId,
      churchId: input.churchId,
      userId,
      type: input.type,
      title: input.title,
      message: input.message,
      contentTitle: input.contentTitle,
      image: input.image?.trim() || null,
      contentId: input.contentId?.trim() || null,
    }))
  );
}
