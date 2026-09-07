import "server-only";

import {
  and,
  desc,
  eq,
  ilike,
  isNotNull,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { unionAll } from "drizzle-orm/pg-core";

import { db } from "@/db";
import {
  articles,
  donationCampaigns,
  events,
  sermons,
  songs,
  videoShorts,
} from "@/db/schema";
import { ADMIN_PAGE_SIZE } from "@/lib/admin-list-utils";
import { requirePlatformSuperAdmin } from "@/lib/auth/require-platform-super-admin";

export const PLATFORM_CONTENT_PAGE_SIZE = ADMIN_PAGE_SIZE;

/** Prayer requests are tenant/community data and never platform showcase content. */
export const PLATFORM_CONTENT_TYPES = [
  "songs",
  "sermons",
  "articles",
  "shorts",
  "events",
  "donations",
] as const;

export type PlatformContentType = (typeof PLATFORM_CONTENT_TYPES)[number];

export const PLATFORM_CONTENT_TABS = ["all", ...PLATFORM_CONTENT_TYPES] as const;

export type PlatformContentTab = (typeof PLATFORM_CONTENT_TABS)[number];

export type PlatformContentStatusFilter = "all" | "published" | "draft";

export type PlatformContentRow = {
  id: string;
  type: PlatformContentType;
  title: string;
  subtitle: string | null;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type PlatformContentPagedList = {
  items: PlatformContentRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function parsePlatformContentTab(
  value: string | null | undefined
): PlatformContentTab {
  const tab = value?.trim();
  return (PLATFORM_CONTENT_TABS as readonly string[]).includes(tab ?? "") ?
      (tab as PlatformContentTab)
    : "all";
}

export function parsePlatformContentStatus(
  value: string | null | undefined
): PlatformContentStatusFilter {
  const status = value?.trim();
  if (status === "published" || status === "draft") return status;
  return "all";
}

export function parsePlatformContentPage(
  value: string | null | undefined
): number {
  const page = Number.parseInt(value?.trim() ?? "", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function toInt(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function pagination(total: number, requestedPage: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(Math.max(total, 0) / pageSize));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  return { page, pageSize, totalPages, offset: (page - 1) * pageSize };
}

/**
 * Per-type mapping of the platform scope predicate, the publish predicate, and
 * the searchable columns. Each content table stores its publish state
 * differently (boolean vs status vs visibility enum), so it is declared once
 * here and reused by counts, lists, and mutations.
 */
const TYPE_FILTERS: {
  [K in PlatformContentType]: {
    scope: SQL;
    published: SQL;
    search: (term: string) => SQL;
  };
} = {
  songs: {
    scope: eq(songs.contentScope, "platform_public"),
    published: eq(songs.published, true),
    search: (term) =>
      or(ilike(songs.songTitle, term), ilike(songs.artist, term))!,
  },
  sermons: {
    scope: eq(sermons.contentScope, "platform_public"),
    published: eq(sermons.isPublished, true),
    search: (term) =>
      or(ilike(sermons.title, term), ilike(sermons.speaker, term))!,
  },
  articles: {
    scope: eq(articles.contentScope, "platform_public"),
    published: eq(articles.isPublished, true),
    search: (term) =>
      or(ilike(articles.title, term), ilike(articles.author, term))!,
  },
  shorts: {
    scope: eq(videoShorts.contentScope, "platform_public"),
    // Mirrors the public feed gate in listShortsForScope. A platform draft is
    // created with visibility "public" before its video exists, so visibility
    // alone would report unpublished drafts as live.
    published: and(
      eq(videoShorts.visibility, "public"),
      isNotNull(videoShorts.publishedAt),
      isNotNull(videoShorts.videoUrl)
    )!,
    search: (term) => ilike(videoShorts.caption, term),
  },
  events: {
    scope: eq(events.contentScope, "platform_public"),
    published: eq(events.status, "published"),
    search: (term) => or(ilike(events.title, term), ilike(events.location, term))!,
  },
  donations: {
    scope: eq(donationCampaigns.contentScope, "platform_public"),
    published: eq(donationCampaigns.status, "active"),
    search: (term) => ilike(donationCampaigns.title, term),
  },
};

export type PlatformContentFilters = {
  search?: string;
  status?: PlatformContentStatusFilter;
};

function whereFor(type: PlatformContentType, filters: PlatformContentFilters) {
  const config = TYPE_FILTERS[type];
  const conditions: SQL[] = [config.scope];

  const term = filters.search?.trim();
  if (term) conditions.push(config.search(`%${term}%`));

  if (filters.status === "published") conditions.push(config.published);
  if (filters.status === "draft") conditions.push(sql`not ${config.published}`);

  return and(...conditions)!;
}

/**
 * Normalized union branches so All Content can page across every type in SQL.
 *
 * Every column is cast explicitly: some branches read enum columns
 * (`short_category`, `donation_currency`) where others read text, and Postgres
 * refuses to unify an enum with text in a UNION.
 */
function unionBranches(filters: PlatformContentFilters) {
  const songRows = db
    .select({
      id: sql<string>`${songs.id}::text`.as("id"),
      type: sql<string>`'songs'::text`.as("type"),
      title: sql<string>`${songs.songTitle}::text`.as("title"),
      subtitle: sql<string | null>`${songs.artist}::text`.as("subtitle"),
      published: sql<boolean>`${songs.published}::boolean`.as("published"),
      createdAt: sql<Date>`${songs.createdAt}`.as("created_at"),
      updatedAt: sql<Date>`${songs.updatedAt}`.as("updated_at"),
    })
    .from(songs)
    .where(whereFor("songs", filters));

  const sermonRows = db
    .select({
      id: sql<string>`${sermons.id}::text`.as("id"),
      type: sql<string>`'sermons'::text`.as("type"),
      title: sql<string>`${sermons.title}::text`.as("title"),
      subtitle: sql<string | null>`${sermons.speaker}::text`.as("subtitle"),
      published: sql<boolean>`${sermons.isPublished}::boolean`.as("published"),
      createdAt: sql<Date>`${sermons.createdAt}`.as("created_at"),
      updatedAt: sql<Date>`${sermons.updatedAt}`.as("updated_at"),
    })
    .from(sermons)
    .where(whereFor("sermons", filters));

  const articleRows = db
    .select({
      id: sql<string>`${articles.id}::text`.as("id"),
      type: sql<string>`'articles'::text`.as("type"),
      title: sql<string>`${articles.title}::text`.as("title"),
      subtitle: sql<string | null>`${articles.author}::text`.as("subtitle"),
      published: sql<boolean>`${articles.isPublished}::boolean`.as("published"),
      createdAt: sql<Date>`${articles.createdAt}`.as("created_at"),
      updatedAt: sql<Date>`${articles.updatedAt}`.as("updated_at"),
    })
    .from(articles)
    .where(whereFor("articles", filters));

  const shortRows = db
    .select({
      id: sql<string>`${videoShorts.id}::text`.as("id"),
      type: sql<string>`'shorts'::text`.as("type"),
      title: sql<string>`${videoShorts.caption}::text`.as("title"),
      subtitle: sql<string | null>`${videoShorts.category}::text`.as("subtitle"),
      published: sql<boolean>`(${videoShorts.visibility} = 'public' and ${videoShorts.publishedAt} is not null and ${videoShorts.videoUrl} is not null)::boolean`.as(
        "published"
      ),
      createdAt: sql<Date>`${videoShorts.createdAt}`.as("created_at"),
      updatedAt: sql<Date>`${videoShorts.updatedAt}`.as("updated_at"),
    })
    .from(videoShorts)
    .where(whereFor("shorts", filters));

  const eventRows = db
    .select({
      id: sql<string>`${events.id}::text`.as("id"),
      type: sql<string>`'events'::text`.as("type"),
      title: sql<string>`${events.title}::text`.as("title"),
      subtitle: sql<string | null>`${events.location}::text`.as("subtitle"),
      published: sql<boolean>`(${events.status} = 'published')::boolean`.as(
        "published"
      ),
      createdAt: sql<Date>`${events.createdAt}`.as("created_at"),
      updatedAt: sql<Date>`${events.updatedAt}`.as("updated_at"),
    })
    .from(events)
    .where(whereFor("events", filters));

  const donationRows = db
    .select({
      id: sql<string>`${donationCampaigns.id}::text`.as("id"),
      type: sql<string>`'donations'::text`.as("type"),
      title: sql<string>`${donationCampaigns.title}::text`.as("title"),
      subtitle: sql<string | null>`${donationCampaigns.currency}::text`.as(
        "subtitle"
      ),
      published: sql<boolean>`(${donationCampaigns.status} = 'active')::boolean`.as(
        "published"
      ),
      createdAt: sql<Date>`${donationCampaigns.createdAt}`.as("created_at"),
      updatedAt: sql<Date>`${donationCampaigns.updatedAt}`.as("updated_at"),
    })
    .from(donationCampaigns)
    .where(whereFor("donations", filters));

  return {
    songs: songRows,
    sermons: sermonRows,
    articles: articleRows,
    shorts: shortRows,
    events: eventRows,
    donations: donationRows,
  };
}

function emptyTypeCounts(): Record<PlatformContentType, number> {
  return {
    songs: 0,
    sermons: 0,
    articles: 0,
    shorts: 0,
    events: 0,
    donations: 0,
  };
}

/**
 * One round-trip for every type's filtered total and published count.
 *
 * The page previously fired 12 parallel COUNT queries (6 types × total +
 * published) against a pool of 10, which timed out and crashed the route.
 */
function countUnion(filters: PlatformContentFilters) {
  const searchWhere = (type: PlatformContentType) => {
    const config = TYPE_FILTERS[type];
    const conditions: SQL[] = [config.scope];
    const term = filters.search?.trim();
    if (term) conditions.push(config.search(`%${term}%`));
    return and(...conditions)!;
  };

  const totalExpr = (type: PlatformContentType) => {
    const published = TYPE_FILTERS[type].published;
    if (filters.status === "published") {
      return sql<number>`count(*) filter (where ${published})::int`;
    }
    if (filters.status === "draft") {
      return sql<number>`count(*) filter (where not ${published})::int`;
    }
    return sql<number>`count(*)::int`;
  };

  const publishedExpr = (type: PlatformContentType) =>
    sql<number>`count(*) filter (where ${TYPE_FILTERS[type].published})::int`;

  const songsCount = db
    .select({
      type: sql<string>`'songs'::text`.as("type"),
      total: totalExpr("songs").as("total"),
      published: publishedExpr("songs").as("published"),
    })
    .from(songs)
    .where(searchWhere("songs"));

  const sermonsCount = db
    .select({
      type: sql<string>`'sermons'::text`.as("type"),
      total: totalExpr("sermons").as("total"),
      published: publishedExpr("sermons").as("published"),
    })
    .from(sermons)
    .where(searchWhere("sermons"));

  const articlesCount = db
    .select({
      type: sql<string>`'articles'::text`.as("type"),
      total: totalExpr("articles").as("total"),
      published: publishedExpr("articles").as("published"),
    })
    .from(articles)
    .where(searchWhere("articles"));

  const shortsCount = db
    .select({
      type: sql<string>`'shorts'::text`.as("type"),
      total: totalExpr("shorts").as("total"),
      published: publishedExpr("shorts").as("published"),
    })
    .from(videoShorts)
    .where(searchWhere("shorts"));

  const eventsCount = db
    .select({
      type: sql<string>`'events'::text`.as("type"),
      total: totalExpr("events").as("total"),
      published: publishedExpr("events").as("published"),
    })
    .from(events)
    .where(searchWhere("events"));

  const donationsCount = db
    .select({
      type: sql<string>`'donations'::text`.as("type"),
      total: totalExpr("donations").as("total"),
      published: publishedExpr("donations").as("published"),
    })
    .from(donationCampaigns)
    .where(searchWhere("donations"));

  return unionAll(
    songsCount,
    sermonsCount,
    articlesCount,
    shortsCount,
    eventsCount,
    donationsCount
  );
}

async function loadTypeCounts(filters: PlatformContentFilters): Promise<{
  counts: Record<PlatformContentType, number>;
  publishedCounts: Record<PlatformContentType, number>;
}> {
  const rows = await countUnion(filters);
  const counts = emptyTypeCounts();
  const publishedCounts = emptyTypeCounts();

  for (const row of rows) {
    const type = row.type as PlatformContentType;
    if (!(type in counts)) continue;
    counts[type] = toInt(row.total);
    publishedCounts[type] = toInt(row.published);
  }

  return { counts, publishedCounts };
}

export async function getPlatformContentMetrics(
  filters: PlatformContentFilters = {}
): Promise<{
  counts: Record<PlatformContentType, number>;
  publishedCounts: Record<PlatformContentType, number>;
}> {
  await requirePlatformSuperAdmin();
  return loadTypeCounts(filters);
}

export async function getPlatformContentCounts(
  filters: PlatformContentFilters = {}
): Promise<Record<PlatformContentType, number>> {
  const { counts } = await getPlatformContentMetrics(filters);
  return counts;
}

export async function listPlatformContent(
  tab: PlatformContentTab,
  filters: PlatformContentFilters,
  requestedPage: number,
  /** Reuses counts the caller already loaded for the type tabs. */
  knownCounts?: Record<PlatformContentType, number>
): Promise<PlatformContentPagedList> {
  await requirePlatformSuperAdmin();

  const pageSize = PLATFORM_CONTENT_PAGE_SIZE;
  const branches = unionBranches(filters);

  const total =
    knownCounts ?
      tab === "all" ?
        Object.values(knownCounts).reduce((sum, value) => sum + value, 0)
      : knownCounts[tab]
    : tab === "all" ?
      Object.values((await loadTypeCounts(filters)).counts).reduce(
        (sum, value) => sum + value,
        0
      )
    : (await loadTypeCounts(filters)).counts[tab];

  const { page, offset, totalPages } = pagination(total, requestedPage, pageSize);

  if (total === 0) {
    return { items: [], total: 0, page: 1, pageSize, totalPages: 1 };
  }

  const query =
    tab === "all" ?
      unionAll(
        branches.songs,
        branches.sermons,
        branches.articles,
        branches.shorts,
        branches.events,
        branches.donations
      )
    : branches[tab];

  const rows = await query
    .orderBy(desc(sql`created_at`))
    .limit(pageSize)
    .offset(offset);

  return {
    items: rows.map((row) => ({
      id: row.id,
      type: row.type as PlatformContentType,
      title: row.title,
      subtitle: row.subtitle,
      published: row.published,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    })),
    total,
    page,
    pageSize,
    totalPages,
  };
}
