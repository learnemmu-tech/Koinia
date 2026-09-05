import "server-only";

import type { AppUserRow } from "@/lib/postgres/app-user";
import type { FirebaseArticle } from "@/types/firebase-article";
import type { FirebaseBranch } from "@/types/branch";
import type { FirebaseBranchMembership } from "@/types/branch-membership";
import type { FirebaseChurch } from "@/types/firebase-church";
import type {
  FirebaseDonation,
  FirebaseDonationCampaign,
} from "@/types/firebase-donation";
import type { FirebaseEvent } from "@/types/firebase-event";
import type { FirebaseInvitation } from "@/types/invitation";
import type { FirebaseMembership, MembershipRole, MembershipStatus } from "@/types/membership";
import type { FirebaseNotification } from "@/types/firebase-notification";
import type {
  FirebasePrayerIntercession,
  FirebasePrayerRequest,
} from "@/types/firebase-prayer-request";
import type { FirebaseSermon } from "@/types/firebase-sermon";
import type { FirebaseSong, SongCategory } from "@/types/firebase-song";
import type {
  FirebaseOrganization,
  OrganizationSettings,
  WorkspaceType,
} from "@/types/organization";
import type { ChurchSubscription } from "@/types/subscription";
import type {
  articles,
  churches,
  churchMemberships,
  donationCampaigns,
  donations,
  eventRegistrations,
  events,
  invitations,
  notifications,
  organizationMemberships,
  organizations,
  prayerIntercessions,
  prayerRequests,
  sermons,
  songs,
  subscriptions,
} from "@/db/schema";

export type OrganizationRow = typeof organizations.$inferSelect;
export type ChurchRow = typeof churches.$inferSelect;
export type OrgMembershipRow = typeof organizationMemberships.$inferSelect;
export type ChurchMembershipRow = typeof churchMemberships.$inferSelect;
export type SongRow = typeof songs.$inferSelect;
export type SermonRow = typeof sermons.$inferSelect;
export type ArticleRow = typeof articles.$inferSelect;
export type EventRow = typeof events.$inferSelect;
export type EventRegistrationRow = typeof eventRegistrations.$inferSelect;
export type PrayerRequestRow = typeof prayerRequests.$inferSelect;
export type PrayerIntercessionRow = typeof prayerIntercessions.$inferSelect;
export type DonationCampaignRow = typeof donationCampaigns.$inferSelect;
export type DonationRow = typeof donations.$inferSelect;
export type NotificationRow = typeof notifications.$inferSelect;
export type InvitationRow = typeof invitations.$inferSelect;
export type SubscriptionRow = typeof subscriptions.$inferSelect;

export function toMillis(value: Date | string | number | null | undefined): number {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function optionalText(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function mapOrganization(
  row: OrganizationRow,
  ownerClerkId: string
): FirebaseOrganization {
  const settings = (row.settings ?? {}) as OrganizationSettings;
  return {
    id: row.id,
    name: row.name,
    logo: optionalText(row.logoUrl),
    description: optionalText(row.description),
    ownerId: ownerClerkId,
    subscriptionPlan: "free",
    status: row.status,
    settings: {
      ...settings,
      workspaceType: row.workspaceType as WorkspaceType,
    },
    createdAt: toMillis(row.createdAt),
    updatedAt: toMillis(row.updatedAt),
  };
}

export function mapChurch(row: ChurchRow): FirebaseChurch {
  return {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    slug: row.slug,
    description: optionalText(row.description),
    logoUrl: optionalText(row.logoUrl),
    bannerUrl: optionalText(row.bannerUrl),
    coverImage: optionalText(row.bannerUrl),
    address: optionalText(row.address),
    city: optionalText(row.city),
    state: optionalText(row.state),
    country: optionalText(row.country),
    phone: optionalText(row.phone),
    email: optionalText(row.email),
    website: optionalText(row.website),
    pastorName: optionalText(row.pastorName),
    establishedYear: row.establishedYear ?? undefined,
    timezone: optionalText(row.timezone),
    currency: optionalText(row.currency),
    denomination: optionalText(row.denomination),
    churchType: optionalText(row.churchType),
    defaultBranchId: row.id,
    settings: {
      defaultLanguage: optionalText(row.defaultLanguage),
      showDonations: row.showDonations,
      showEvents: row.showEvents,
      showPrayerWall: row.showPrayerWall,
    },
    primaryColor: optionalText(row.primaryColor),
    secondaryColor: optionalText(row.secondaryColor),
    welcomeMessage: optionalText(row.welcomeMessage),
    isActive: row.isActive,
    createdAt: toMillis(row.createdAt),
    updatedAt: toMillis(row.updatedAt),
  };
}

export function virtualBranchFromChurch(row: ChurchRow): FirebaseBranch {
  return {
    id: row.id,
    organizationId: row.organizationId,
    churchId: row.id,
    name: row.name,
    slug: row.joinSlug || row.slug,
    description: optionalText(row.description),
    address: optionalText(row.address),
    city: optionalText(row.city),
    state: optionalText(row.state),
    country: optionalText(row.country),
    phone: optionalText(row.phone),
    email: optionalText(row.email),
    isActive: row.isActive,
    isDefault: true,
    settings: {
      enrollmentMode: row.enrollmentMode,
      joinUrlEnabled: row.joinUrlEnabled,
    },
    retiredJoinSlugs: row.retiredJoinSlugs ?? [],
    createdAt: toMillis(row.createdAt),
    updatedAt: toMillis(row.updatedAt),
  };
}

export function mapOrgMembership(
  row: OrgMembershipRow,
  clerkUserId: string
): FirebaseMembership {
  return {
    id: row.id,
    organizationId: row.organizationId,
    userId: clerkUserId,
    role: row.role,
    status: row.status,
    createdAt: toMillis(row.createdAt),
    updatedAt: toMillis(row.updatedAt),
  };
}

export function mapChurchMembership(
  row: ChurchMembershipRow,
  clerkUserId: string
): FirebaseBranchMembership {
  return {
    id: row.id,
    organizationId: row.organizationId,
    churchId: row.churchId,
    branchId: row.churchId,
    userId: clerkUserId,
    role: row.role as MembershipRole,
    status: row.status as MembershipStatus,
    createdAt: toMillis(row.createdAt),
    updatedAt: toMillis(row.updatedAt),
  };
}

export function mapSong(row: SongRow): FirebaseSong {
  const title = row.songTitle;
  return {
    id: row.id,
    organizationId: row.organizationId,
    churchId: row.churchId,
    branchId: row.churchId,
    songTitle: title,
    alternateTitle: optionalText(row.alternateTitle),
    artist: optionalText(row.artist),
    category: row.category as SongCategory,
    originalLyrics: row.originalLyrics,
    translationLyrics: optionalText(row.translationLyrics),
    scriptureReference: optionalText(row.scriptureReference),
    tags: row.tags ?? [],
    featured: row.featured,
    published: row.published,
    title,
    lyrics: row.originalLyrics,
    transliteratedLyrics: optionalText(row.translationLyrics),
    imageUrl: optionalText(row.imageUrl),
    audioUrl: optionalText(row.audioUrl),
    youtubeUrl: optionalText(row.youtubeUrl),
    createdAt: toMillis(row.createdAt),
    playCount: row.playCount,
  };
}

export function mapSermon(row: SermonRow, createdByClerkId: string): FirebaseSermon {
  return {
    id: row.id,
    churchId: row.churchId,
    title: row.title,
    subtitle: optionalText(row.subtitle),
    scriptureReference: row.scriptureReference,
    speaker: row.speaker,
    shortDescription: row.shortDescription,
    content: row.content,
    tags: row.tags ?? [],
    youtubeUrl: optionalText(row.youtubeUrl),
    audioUrl: optionalText(row.audioUrl),
    coverImage: optionalText(row.coverImage),
    dateCreated: toMillis(row.createdAt),
    createdBy: createdByClerkId,
    isPublished: row.isPublished,
  };
}

export function mapArticle(row: ArticleRow, createdByClerkId: string): FirebaseArticle {
  return {
    id: row.id,
    churchId: row.churchId,
    title: row.title,
    category: row.category,
    shortDescription: row.shortDescription,
    scriptureReference: optionalText(row.scriptureReference),
    content: row.content,
    coverImage: optionalText(row.coverImage),
    author: row.author,
    authorImage: optionalText(row.authorImage),
    tags: row.tags ?? [],
    youtubeUrl: optionalText(row.youtubeUrl),
    featured: row.featured,
    dateCreated: toMillis(row.createdAt),
    createdBy: createdByClerkId,
    isPublished: row.isPublished,
  };
}

export function mapEvent(row: EventRow): FirebaseEvent {
  return {
    id: row.id,
    churchId: row.churchId,
    title: row.title,
    description: row.description,
    bannerImage: optionalText(row.bannerImage),
    eventType: row.eventType,
    speakerName: row.speakerName,
    eventDate: String(row.eventDate),
    eventTime: row.eventTime,
    location: row.location,
    status: row.status,
    createdAt: toMillis(row.createdAt),
    updatedAt: toMillis(row.updatedAt),
  };
}

export function mapPrayerRequest(
  row: PrayerRequestRow,
  clerkUserId?: string | null
): FirebasePrayerRequest {
  return {
    id: row.id,
    churchId: row.churchId,
    userId: clerkUserId ?? undefined,
    name: row.name,
    email: optionalText(row.email),
    title: row.title,
    request: row.request,
    category: row.category,
    isAnonymous: row.isAnonymous,
    shareWithCommunity: row.shareWithCommunity,
    isAnswered: row.isAnswered,
    answeredAt: row.answeredAt ? toMillis(row.answeredAt) : undefined,
    status: row.status,
    prayerCount: row.prayerCount,
    createdAt: toMillis(row.createdAt),
    updatedAt: toMillis(row.updatedAt),
  };
}

export function mapPrayerIntercession(
  row: PrayerIntercessionRow,
  clerkUserId: string
): FirebasePrayerIntercession {
  return {
    id: row.id,
    requestId: row.prayerRequestId,
    userId: clerkUserId,
    createdAt: toMillis(row.createdAt),
  };
}

export function mapDonationCampaign(row: DonationCampaignRow): FirebaseDonationCampaign {
  return {
    id: row.id,
    churchId: row.churchId,
    organizationId: row.organizationId,
    branchId: row.churchId,
    title: row.title,
    description: row.description,
    bannerImage: optionalText(row.bannerImage),
    targetAmount: Number(row.targetAmount ?? 0),
    currentAmount: Number(row.currentAmount ?? 0),
    currency: row.currency,
    status: row.status,
    createdAt: toMillis(row.createdAt),
    updatedAt: toMillis(row.updatedAt),
  };
}

export function mapDonation(row: DonationRow): FirebaseDonation {
  return {
    id: row.id,
    churchId: row.churchId,
    organizationId: row.organizationId,
    branchId: row.churchId,
    campaignId: row.campaignId,
    donorName: row.donorName,
    donorEmail: row.donorEmail,
    amount: Number(row.amount ?? 0),
    currency: row.currency,
    paymentStatus: row.paymentStatus,
    paymentProvider: row.paymentProvider,
    transactionId: row.transactionId,
    isAnonymous: row.isAnonymous,
    createdAt: toMillis(row.createdAt),
  };
}

export function mapNotification(
  row: NotificationRow,
  clerkUserId: string,
  read: boolean
): FirebaseNotification {
  return {
    id: row.id,
    type: row.type,
    userId: clerkUserId,
    churchId: row.churchId,
    title: row.title,
    message: row.message,
    contentTitle: row.contentTitle,
    image: optionalText(row.image),
    contentId: row.contentId ?? "",
    read,
    createdAt: toMillis(row.createdAt),
  };
}

export function mapInvitation(
  row: InvitationRow,
  invitedByClerkId: string,
  acceptedByClerkId?: string | null
): FirebaseInvitation {
  return {
    id: row.id,
    organizationId: row.organizationId,
    churchId: row.churchId,
    branchId: row.churchId,
    role: row.role as MembershipRole,
    email: optionalText(row.email),
    deliveryMethod: row.deliveryMethod,
    token: row.token,
    invitedBy: invitedByClerkId,
    status: row.status,
    expiresAt: toMillis(row.expiresAt),
    acceptedAt: row.acceptedAt ? toMillis(row.acceptedAt) : undefined,
    acceptedBy: acceptedByClerkId ?? undefined,
    createdAt: toMillis(row.createdAt),
    updatedAt: toMillis(row.updatedAt),
  };
}

export function mapSubscription(row: SubscriptionRow): ChurchSubscription {
  return {
    id: row.id,
    organizationId: row.organizationId,
    planId: row.planId,
    status: row.status,
    billingInterval: row.billingInterval ?? undefined,
    trialStart: row.trialStart ? toMillis(row.trialStart) : undefined,
    trialEnd: row.trialEnd ? toMillis(row.trialEnd) : undefined,
    currentPeriodStart: row.currentPeriodStart
      ? toMillis(row.currentPeriodStart)
      : undefined,
    currentPeriodEnd: row.currentPeriodEnd
      ? toMillis(row.currentPeriodEnd)
      : undefined,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    featureFlags: (row.featureFlags ?? undefined) as ChurchSubscription["featureFlags"],
    usage: (row.usage ?? undefined) as ChurchSubscription["usage"],
    stripeCustomerId: optionalText(row.stripeCustomerId),
    stripeSubscriptionId: optionalText(row.stripeSubscriptionId),
    createdAt: toMillis(row.createdAt),
    updatedAt: toMillis(row.updatedAt),
  };
}

export function publicUserFields(row: AppUserRow) {
  return {
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
  };
}
