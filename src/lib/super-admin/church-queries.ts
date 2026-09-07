import "server-only";

import { and, count, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  articles,
  churchMemberships,
  churches,
  donationCampaigns,
  donations,
  events,
  organizations,
  prayerRequests,
  sermons,
  songs,
  users,
  videoShorts,
} from "@/db/schema";
import { requirePlatformSuperAdmin } from "@/lib/auth/require-platform-super-admin";
import { ADMIN_PAGE_SIZE } from "@/lib/admin-list-utils";
import { isPostgresUuid } from "@/lib/postgres/uuid";

export const SUPER_ADMIN_CHURCH_PAGE_SIZE = ADMIN_PAGE_SIZE;

export const SUPER_ADMIN_CHURCH_TABS = [
  "members",
  "songs",
  "sermons",
  "articles",
  "events",
  "prayers",
  "donations",
  "shorts",
] as const;

export type SuperAdminChurchTab = (typeof SUPER_ADMIN_CHURCH_TABS)[number];

export type SuperAdminChurchOverview = {
  church: {
    id: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
    organizationId: string;
    organizationName: string;
    workspaceType: string;
    city: string | null;
    state: string | null;
    country: string | null;
    pastorName: string | null;
    denomination: string | null;
    churchType: string | null;
    email: string | null;
    enrollmentMode: string;
  };
  members: {
    total: number;
    active: number;
    pending: number;
    suspended: number;
  };
  content: {
    songs: number;
    sermons: number;
    articles: number;
    events: number;
    prayerRequests: number;
    donations: number;
    campaigns: number;
    shorts: number;
  };
};

export type SuperAdminPagedList<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function toInt(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function parseSuperAdminChurchTab(
  value: string | null | undefined
): SuperAdminChurchTab {
  const tab = value?.trim();
  if (
    tab === "members" ||
    tab === "songs" ||
    tab === "sermons" ||
    tab === "articles" ||
    tab === "events" ||
    tab === "prayers" ||
    tab === "donations" ||
    tab === "shorts"
  ) {
    return tab;
  }
  return "members";
}

function pagination(total: number, requestedPage: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(Math.max(total, 0) / pageSize));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  return {
    page,
    pageSize,
    totalPages,
    offset: (page - 1) * pageSize,
  };
}

function churchContentScope(
  churchIdColumn: Parameters<typeof eq>[0],
  organizationIdColumn: Parameters<typeof eq>[0],
  churchId: string,
  organizationId: string
) {
  return and(
    eq(churchIdColumn, churchId),
    eq(organizationIdColumn, organizationId)
  );
}

export async function getSuperAdminChurchOverview(
  churchId: string
): Promise<SuperAdminChurchOverview | null> {
  await requirePlatformSuperAdmin();

  const id = churchId.trim();
  if (!isPostgresUuid(id)) return null;

  const [row] = await db
    .select({
      id: churches.id,
      name: churches.name,
      isActive: churches.isActive,
      createdAt: churches.createdAt,
      organizationId: churches.organizationId,
      city: churches.city,
      state: churches.state,
      country: churches.country,
      pastorName: churches.pastorName,
      denomination: churches.denomination,
      churchType: churches.churchType,
      email: churches.email,
      enrollmentMode: churches.enrollmentMode,
      organizationName: organizations.name,
      workspaceType: organizations.workspaceType,
    })
    .from(churches)
    .innerJoin(organizations, eq(organizations.id, churches.organizationId))
    .where(eq(churches.id, id))
    .limit(1);

  if (!row) return null;

  const orgId = row.organizationId;
  const memberWhere = and(
    eq(churchMemberships.churchId, id),
    eq(churchMemberships.organizationId, orgId)
  );

  const [
    memberTotal,
    memberByStatus,
    songCount,
    sermonCount,
    articleCount,
    eventCount,
    prayerCount,
    donationCount,
    campaignCount,
    shortCount,
  ] = await Promise.all([
    db
      .select({
        value: sql<number>`count(distinct ${churchMemberships.userId})::int`,
      })
      .from(churchMemberships)
      .where(memberWhere),
    db
      .select({
        status: churchMemberships.status,
        value: sql<number>`count(distinct ${churchMemberships.userId})::int`,
      })
      .from(churchMemberships)
      .where(memberWhere)
      .groupBy(churchMemberships.status),
    db
      .select({ value: count() })
      .from(songs)
      .where(churchContentScope(songs.churchId, songs.organizationId, id, orgId)),
    db
      .select({ value: count() })
      .from(sermons)
      .where(
        churchContentScope(sermons.churchId, sermons.organizationId, id, orgId)
      ),
    db
      .select({ value: count() })
      .from(articles)
      .where(
        churchContentScope(articles.churchId, articles.organizationId, id, orgId)
      ),
    db
      .select({ value: count() })
      .from(events)
      .where(
        churchContentScope(events.churchId, events.organizationId, id, orgId)
      ),
    db
      .select({ value: count() })
      .from(prayerRequests)
      .where(
        churchContentScope(
          prayerRequests.churchId,
          prayerRequests.organizationId,
          id,
          orgId
        )
      ),
    db
      .select({ value: count() })
      .from(donations)
      .where(
        churchContentScope(
          donations.churchId,
          donations.organizationId,
          id,
          orgId
        )
      ),
    db
      .select({ value: count() })
      .from(donationCampaigns)
      .where(
        churchContentScope(
          donationCampaigns.churchId,
          donationCampaigns.organizationId,
          id,
          orgId
        )
      ),
    db
      .select({ value: count() })
      .from(videoShorts)
      .where(
        churchContentScope(
          videoShorts.churchId,
          videoShorts.organizationId,
          id,
          orgId
        )
      ),
  ]);

  const statusCount = (status: string) =>
    toInt(
      memberByStatus.find((item) => item.status === status)?.value
    );

  return {
    church: {
      id: row.id,
      name: row.name,
      isActive: row.isActive,
      createdAt: row.createdAt,
      organizationId: row.organizationId,
      organizationName: row.organizationName,
      workspaceType: row.workspaceType,
      city: row.city,
      state: row.state,
      country: row.country,
      pastorName: row.pastorName,
      denomination: row.denomination,
      churchType: row.churchType,
      email: row.email,
      enrollmentMode: row.enrollmentMode,
    },
    members: {
      total: toInt(memberTotal[0]?.value),
      active: statusCount("active"),
      pending: statusCount("pending"),
      suspended: statusCount("suspended"),
    },
    content: {
      songs: toInt(songCount[0]?.value),
      sermons: toInt(sermonCount[0]?.value),
      articles: toInt(articleCount[0]?.value),
      events: toInt(eventCount[0]?.value),
      prayerRequests: toInt(prayerCount[0]?.value),
      donations: toInt(donationCount[0]?.value),
      campaigns: toInt(campaignCount[0]?.value),
      shorts: toInt(shortCount[0]?.value),
    },
  };
}

export async function listSuperAdminChurchMembers(
  churchId: string,
  organizationId: string,
  requestedPage: number
): Promise<
  SuperAdminPagedList<{
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
    role: string;
    createdAt: Date;
  }>
> {
  await requirePlatformSuperAdmin();
  const pageSize = SUPER_ADMIN_CHURCH_PAGE_SIZE;
  const scope = and(
    eq(churchMemberships.churchId, churchId),
    eq(churchMemberships.organizationId, organizationId)
  );

  const [totalRow] = await db
    .select({ value: count() })
    .from(churchMemberships)
    .where(scope);
  const total = toInt(totalRow?.value);
  const { page, offset, totalPages } = pagination(total, requestedPage, pageSize);

  if (total === 0) {
    return { items: [], total: 0, page: 1, pageSize, totalPages: 1 };
  }

  const items = await db
    .select({
      userId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      status: churchMemberships.status,
      role: churchMemberships.role,
      createdAt: churchMemberships.createdAt,
    })
    .from(churchMemberships)
    .innerJoin(users, eq(users.id, churchMemberships.userId))
    .where(scope)
    .orderBy(desc(churchMemberships.createdAt))
    .limit(pageSize)
    .offset(offset);

  return { items, total, page, pageSize, totalPages };
}

export async function listSuperAdminChurchSongs(
  churchId: string,
  organizationId: string,
  requestedPage: number
): Promise<
  SuperAdminPagedList<{
    id: string;
    songTitle: string;
    artist: string | null;
    category: string;
    published: boolean;
    createdAt: Date;
  }>
> {
  await requirePlatformSuperAdmin();
  const pageSize = SUPER_ADMIN_CHURCH_PAGE_SIZE;
  const scope = churchContentScope(
    songs.churchId,
    songs.organizationId,
    churchId,
    organizationId
  );

  const [totalRow] = await db.select({ value: count() }).from(songs).where(scope);
  const total = toInt(totalRow?.value);
  const { page, offset, totalPages } = pagination(total, requestedPage, pageSize);
  if (total === 0) {
    return { items: [], total: 0, page: 1, pageSize, totalPages: 1 };
  }

  const items = await db
    .select({
      id: songs.id,
      songTitle: songs.songTitle,
      artist: songs.artist,
      category: songs.category,
      published: songs.published,
      createdAt: songs.createdAt,
    })
    .from(songs)
    .where(scope)
    .orderBy(desc(songs.createdAt))
    .limit(pageSize)
    .offset(offset);

  return { items, total, page, pageSize, totalPages };
}

export async function listSuperAdminChurchSermons(
  churchId: string,
  organizationId: string,
  requestedPage: number
): Promise<
  SuperAdminPagedList<{
    id: string;
    title: string;
    speaker: string;
    isPublished: boolean;
    createdAt: Date;
  }>
> {
  await requirePlatformSuperAdmin();
  const pageSize = SUPER_ADMIN_CHURCH_PAGE_SIZE;
  const scope = churchContentScope(
    sermons.churchId,
    sermons.organizationId,
    churchId,
    organizationId
  );

  const [totalRow] = await db.select({ value: count() }).from(sermons).where(scope);
  const total = toInt(totalRow?.value);
  const { page, offset, totalPages } = pagination(total, requestedPage, pageSize);
  if (total === 0) {
    return { items: [], total: 0, page: 1, pageSize, totalPages: 1 };
  }

  const items = await db
    .select({
      id: sermons.id,
      title: sermons.title,
      speaker: sermons.speaker,
      isPublished: sermons.isPublished,
      createdAt: sermons.createdAt,
    })
    .from(sermons)
    .where(scope)
    .orderBy(desc(sermons.createdAt))
    .limit(pageSize)
    .offset(offset);

  return { items, total, page, pageSize, totalPages };
}

export async function listSuperAdminChurchArticles(
  churchId: string,
  organizationId: string,
  requestedPage: number
): Promise<
  SuperAdminPagedList<{
    id: string;
    title: string;
    author: string;
    isPublished: boolean;
    createdAt: Date;
  }>
> {
  await requirePlatformSuperAdmin();
  const pageSize = SUPER_ADMIN_CHURCH_PAGE_SIZE;
  const scope = churchContentScope(
    articles.churchId,
    articles.organizationId,
    churchId,
    organizationId
  );

  const [totalRow] = await db.select({ value: count() }).from(articles).where(scope);
  const total = toInt(totalRow?.value);
  const { page, offset, totalPages } = pagination(total, requestedPage, pageSize);
  if (total === 0) {
    return { items: [], total: 0, page: 1, pageSize, totalPages: 1 };
  }

  const items = await db
    .select({
      id: articles.id,
      title: articles.title,
      author: articles.author,
      isPublished: articles.isPublished,
      createdAt: articles.createdAt,
    })
    .from(articles)
    .where(scope)
    .orderBy(desc(articles.createdAt))
    .limit(pageSize)
    .offset(offset);

  return { items, total, page, pageSize, totalPages };
}

export async function listSuperAdminChurchEvents(
  churchId: string,
  organizationId: string,
  requestedPage: number
): Promise<
  SuperAdminPagedList<{
    id: string;
    title: string;
    eventDate: string;
    location: string;
    status: string;
    createdAt: Date;
  }>
> {
  await requirePlatformSuperAdmin();
  const pageSize = SUPER_ADMIN_CHURCH_PAGE_SIZE;
  const scope = churchContentScope(
    events.churchId,
    events.organizationId,
    churchId,
    organizationId
  );

  const [totalRow] = await db.select({ value: count() }).from(events).where(scope);
  const total = toInt(totalRow?.value);
  const { page, offset, totalPages } = pagination(total, requestedPage, pageSize);
  if (total === 0) {
    return { items: [], total: 0, page: 1, pageSize, totalPages: 1 };
  }

  const items = await db
    .select({
      id: events.id,
      title: events.title,
      eventDate: events.eventDate,
      location: events.location,
      status: events.status,
      createdAt: events.createdAt,
    })
    .from(events)
    .where(scope)
    .orderBy(desc(events.eventDate), desc(events.createdAt))
    .limit(pageSize)
    .offset(offset);

  return { items, total, page, pageSize, totalPages };
}

export async function listSuperAdminChurchPrayers(
  churchId: string,
  organizationId: string,
  requestedPage: number
): Promise<
  SuperAdminPagedList<{
    id: string;
    title: string;
    status: string;
    isAnonymous: boolean;
    requesterName: string;
    createdAt: Date;
  }>
> {
  await requirePlatformSuperAdmin();
  const pageSize = SUPER_ADMIN_CHURCH_PAGE_SIZE;
  const scope = churchContentScope(
    prayerRequests.churchId,
    prayerRequests.organizationId,
    churchId,
    organizationId
  );

  const [totalRow] = await db
    .select({ value: count() })
    .from(prayerRequests)
    .where(scope);
  const total = toInt(totalRow?.value);
  const { page, offset, totalPages } = pagination(total, requestedPage, pageSize);
  if (total === 0) {
    return { items: [], total: 0, page: 1, pageSize, totalPages: 1 };
  }

  const items = await db
    .select({
      id: prayerRequests.id,
      title: prayerRequests.title,
      status: prayerRequests.status,
      isAnonymous: prayerRequests.isAnonymous,
      requesterName: prayerRequests.name,
      createdAt: prayerRequests.createdAt,
    })
    .from(prayerRequests)
    .where(scope)
    .orderBy(desc(prayerRequests.createdAt))
    .limit(pageSize)
    .offset(offset);

  return { items, total, page, pageSize, totalPages };
}

export async function listSuperAdminChurchDonations(
  churchId: string,
  organizationId: string,
  requestedPage: number
): Promise<
  SuperAdminPagedList<{
    id: string;
    title: string;
    status: string;
    currency: string;
    targetAmount: string;
    currentAmount: string;
    createdAt: Date;
  }> & {
    completedDonationCount: number;
  }
> {
  await requirePlatformSuperAdmin();
  const pageSize = SUPER_ADMIN_CHURCH_PAGE_SIZE;
  const campaignScope = churchContentScope(
    donationCampaigns.churchId,
    donationCampaigns.organizationId,
    churchId,
    organizationId
  );
  const donationScope = churchContentScope(
    donations.churchId,
    donations.organizationId,
    churchId,
    organizationId
  );

  const [campaignTotalRows, completedDonationRows] = await Promise.all([
    db.select({ value: count() }).from(donationCampaigns).where(campaignScope),
    db
      .select({ value: count() })
      .from(donations)
      .where(and(donationScope, eq(donations.paymentStatus, "completed"))),
  ]);

  const total = toInt(campaignTotalRows[0]?.value);
  const completedDonationCount = toInt(completedDonationRows[0]?.value);
  const { page, offset, totalPages } = pagination(total, requestedPage, pageSize);

  if (total === 0) {
    return {
      items: [],
      total: 0,
      page: 1,
      pageSize,
      totalPages: 1,
      completedDonationCount,
    };
  }

  const items = await db
    .select({
      id: donationCampaigns.id,
      title: donationCampaigns.title,
      status: donationCampaigns.status,
      currency: donationCampaigns.currency,
      targetAmount: donationCampaigns.targetAmount,
      currentAmount: donationCampaigns.currentAmount,
      createdAt: donationCampaigns.createdAt,
    })
    .from(donationCampaigns)
    .where(campaignScope)
    .orderBy(desc(donationCampaigns.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
    completedDonationCount,
  };
}

export async function listSuperAdminChurchShorts(
  churchId: string,
  organizationId: string,
  requestedPage: number
): Promise<
  SuperAdminPagedList<{
    id: string;
    caption: string;
    category: string;
    visibility: string;
    thumbnailUrl: string | null;
    creatorName: string;
    createdAt: Date;
  }>
> {
  await requirePlatformSuperAdmin();
  const pageSize = SUPER_ADMIN_CHURCH_PAGE_SIZE;
  const scope = churchContentScope(
    videoShorts.churchId,
    videoShorts.organizationId,
    churchId,
    organizationId
  );

  const [totalRow] = await db
    .select({ value: count() })
    .from(videoShorts)
    .where(scope);
  const total = toInt(totalRow?.value);
  const { page, offset, totalPages } = pagination(total, requestedPage, pageSize);
  if (total === 0) {
    return { items: [], total: 0, page: 1, pageSize, totalPages: 1 };
  }

  const items = await db
    .select({
      id: videoShorts.id,
      caption: videoShorts.caption,
      category: videoShorts.category,
      visibility: videoShorts.visibility,
      thumbnailUrl: videoShorts.thumbnailUrl,
      creatorFirstName: users.firstName,
      creatorLastName: users.lastName,
      createdAt: videoShorts.createdAt,
    })
    .from(videoShorts)
    .innerJoin(users, eq(users.id, videoShorts.userId))
    .where(scope)
    .orderBy(desc(videoShorts.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    items: items.map((item) => ({
      id: item.id,
      caption: item.caption,
      category: item.category,
      visibility: item.visibility,
      thumbnailUrl: item.thumbnailUrl,
      creatorName:
        [item.creatorFirstName, item.creatorLastName]
          .filter(Boolean)
          .join(" ")
          .trim() || "Unknown",
      createdAt: item.createdAt,
    })),
    total,
    page,
    pageSize,
    totalPages,
  };
}
