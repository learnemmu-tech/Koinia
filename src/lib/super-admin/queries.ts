import "server-only";

import { and, count, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import {
  articles,
  churchMemberships,
  churches,
  donations,
  events,
  organizations,
  prayerRequests,
  sermons,
  songs,
  subscriptions,
  users,
  videoShorts,
} from "@/db/schema";
import { requirePlatformSuperAdmin } from "@/lib/auth/require-platform-super-admin";
import { isPostgresUuid } from "@/lib/postgres/uuid";
import { ADMIN_PAGE_SIZE } from "@/lib/admin-list-utils";

export const SUPER_ADMIN_ORG_PAGE_SIZE = ADMIN_PAGE_SIZE;

export type SuperAdminPlatformOverview = {
  totalOrganizations: number;
  activeOrganizations: number;
  suspendedOrganizations: number;
  totalChurches: number;
  activeChurches: number;
  inactiveChurches: number;
  totalPlatformUsers: number;
  totalChurchMembers: number;
  content: {
    songs: number;
    sermons: number;
    articles: number;
    events: number;
    prayerRequests: number;
    donations: number;
    shorts: number;
  };
  recentOrganizations: SuperAdminOrganizationListItem[];
  attentionOrganizations: SuperAdminOrganizationListItem[];
};

export type SuperAdminOrganizationListItem = {
  id: string;
  name: string;
  workspaceType: string;
  status: string;
  createdAt: Date;
  planId: string | null;
  subscriptionStatus: string | null;
  churchCount: number;
  memberCount: number;
};

export type SuperAdminOrganizationListResult = {
  items: SuperAdminOrganizationListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type SuperAdminOrganizationListFilters = {
  q?: string;
  workspaceType?: string;
  status?: string;
  planId?: string;
  subscriptionStatus?: string;
  page?: number;
};

export type SuperAdminChurchListItem = {
  id: string;
  name: string;
  organizationId: string;
  organizationName: string;
  workspaceType: string;
  isActive: boolean;
  memberCount: number;
  createdAt: Date;
};

export type SuperAdminChurchListResult = {
  items: SuperAdminChurchListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type SuperAdminChurchListFilters = {
  q?: string;
  organizationId?: string;
  organizationQ?: string;
  isActive?: string;
  page?: number;
};

export type SuperAdminMemberListItem = {
  id: string;
  email: string;
  displayName: string;
  platformRole: string;
  organizationName: string | null;
  churchNames: string[];
  membershipStatus: string | null;
  createdAt: Date;
};

export type SuperAdminMemberListResult = {
  items: SuperAdminMemberListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type SuperAdminMemberListFilters = {
  q?: string;
  organizationId?: string;
  churchId?: string;
  platformRole?: string;
  page?: number;
};

export type SuperAdminSubscriptionListItem = {
  id: string;
  organizationId: string;
  organizationName: string;
  planId: string;
  subscriptionStatus: string;
  organizationAccess: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  createdAt: Date;
};

export type SuperAdminSubscriptionListResult = {
  items: SuperAdminSubscriptionListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type SuperAdminSubscriptionListFilters = {
  q?: string;
  planId?: string;
  subscriptionStatus?: string;
  organizationAccess?: string;
  page?: number;
};

export type SuperAdminSearchResult = {
  organizations: SuperAdminOrganizationListItem[];
  churches: SuperAdminChurchListItem[];
  members: SuperAdminMemberListItem[];
};

export type SuperAdminChurchRow = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  memberCount: number;
};

export type SuperAdminMemberStatusCount = {
  status: string;
  count: number;
};

export type SuperAdminOrganizationDetail = {
  organization: {
    id: string;
    name: string;
    workspaceType: string;
    status: string;
    createdAt: Date;
    planId: string | null;
    subscriptionStatus: string | null;
  };
  churches: SuperAdminChurchRow[];
  members: {
    total: number;
    active: number;
    pending: number;
    suspended: number;
    byStatus: SuperAdminMemberStatusCount[];
  };
  content: {
    songs: number;
    sermons: number;
    articles: number;
    events: number;
    prayerRequests: number;
    donations: number;
    shorts: number;
  };
};

function toInt(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function escapeIlike(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
}

function organizationListWhere(
  filters: SuperAdminOrganizationListFilters
): SQL | undefined {
  const conditions: SQL[] = [];
  const q = filters.q?.trim();
  if (q) {
    conditions.push(ilike(organizations.name, `%${escapeIlike(q)}%`));
  }
  if (
    filters.workspaceType === "independent_church" ||
    filters.workspaceType === "multi_church_org"
  ) {
    conditions.push(eq(organizations.workspaceType, filters.workspaceType));
  }
  if (
    filters.status === "active" ||
    filters.status === "suspended" ||
    filters.status === "trial"
  ) {
    conditions.push(eq(organizations.status, filters.status));
  }
  if (
    filters.planId === "free" ||
    filters.planId === "starter" ||
    filters.planId === "professional" ||
    filters.planId === "enterprise"
  ) {
    conditions.push(eq(subscriptions.planId, filters.planId));
  }
  if (
    filters.subscriptionStatus === "active" ||
    filters.subscriptionStatus === "trialing" ||
    filters.subscriptionStatus === "past_due" ||
    filters.subscriptionStatus === "canceled" ||
    filters.subscriptionStatus === "incomplete"
  ) {
    conditions.push(eq(subscriptions.status, filters.subscriptionStatus));
  }
  return conditions.length ? and(...conditions) : undefined;
}

export async function getSuperAdminPlatformOverview(): Promise<SuperAdminPlatformOverview> {
  await requirePlatformSuperAdmin();

  const [
    orgRow,
    activeOrgRow,
    churchRow,
    activeRow,
    inactiveRow,
    platformUserRow,
    churchMemberRow,
    suspendedOrgRow,
    songCount,
    sermonCount,
    articleCount,
    eventCount,
    prayerCount,
    donationCount,
    shortCount,
    recentOrgs,
    attentionOrgs,
  ] = await Promise.all([
    db.select({ value: count() }).from(organizations),
    db
      .select({ value: count() })
      .from(organizations)
      .where(eq(organizations.status, "active")),
    db.select({ value: count() }).from(churches),
    db
      .select({ value: count() })
      .from(churches)
      .where(eq(churches.isActive, true)),
    db
      .select({ value: count() })
      .from(churches)
      .where(eq(churches.isActive, false)),
    db.select({ value: count() }).from(users),
    db
      .select({
        value: sql<number>`count(distinct ${churchMemberships.userId})::int`,
      })
      .from(churchMemberships),
    db
      .select({ value: count() })
      .from(organizations)
      .where(eq(organizations.status, "suspended")),
    db.select({ value: count() }).from(songs),
    db.select({ value: count() }).from(sermons),
    db.select({ value: count() }).from(articles),
    db.select({ value: count() }).from(events),
    db.select({ value: count() }).from(prayerRequests),
    db.select({ value: count() }).from(donations),
    db.select({ value: count() }).from(videoShorts),
    listSuperAdminOrganizations({ page: 1 }),
    listSuperAdminOrganizations({ status: "suspended", page: 1 }),
  ]);

  return {
    totalOrganizations: toInt(orgRow[0]?.value),
    activeOrganizations: toInt(activeOrgRow[0]?.value),
    suspendedOrganizations: toInt(suspendedOrgRow[0]?.value),
    totalChurches: toInt(churchRow[0]?.value),
    activeChurches: toInt(activeRow[0]?.value),
    inactiveChurches: toInt(inactiveRow[0]?.value),
    totalPlatformUsers: toInt(platformUserRow[0]?.value),
    totalChurchMembers: toInt(churchMemberRow[0]?.value),
    content: {
      songs: toInt(songCount[0]?.value),
      sermons: toInt(sermonCount[0]?.value),
      articles: toInt(articleCount[0]?.value),
      events: toInt(eventCount[0]?.value),
      prayerRequests: toInt(prayerCount[0]?.value),
      donations: toInt(donationCount[0]?.value),
      shorts: toInt(shortCount[0]?.value),
    },
    recentOrganizations: recentOrgs.items.slice(0, 5),
    attentionOrganizations: attentionOrgs.items.slice(0, 5),
  };
}

export async function listSuperAdminOrganizations(
  filters: SuperAdminOrganizationListFilters
): Promise<SuperAdminOrganizationListResult> {
  await requirePlatformSuperAdmin();

  const pageSize = SUPER_ADMIN_ORG_PAGE_SIZE;
  const requestedPage = Math.max(1, filters.page ?? 1);
  const whereClause = organizationListWhere(filters);

  const [totalRow] = await db
    .select({ value: count() })
    .from(organizations)
    .leftJoin(
      subscriptions,
      eq(subscriptions.organizationId, organizations.id)
    )
    .where(whereClause);

  const total = toInt(totalRow?.value);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const offset = (page - 1) * pageSize;

  if (total === 0) {
    return { items: [], total: 0, page: 1, pageSize, totalPages: 1 };
  }

  const orgRows = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      workspaceType: organizations.workspaceType,
      status: organizations.status,
      createdAt: organizations.createdAt,
      planId: subscriptions.planId,
      subscriptionStatus: subscriptions.status,
    })
    .from(organizations)
    .leftJoin(
      subscriptions,
      eq(subscriptions.organizationId, organizations.id)
    )
    .where(whereClause)
    .orderBy(desc(organizations.createdAt))
    .limit(pageSize)
    .offset(offset);

  const ids = orgRows.map((row) => row.id);
  const [churchCountRows, memberCountRows] = await Promise.all([
    db
      .select({
        organizationId: churches.organizationId,
        value: count(),
      })
      .from(churches)
      .where(inArray(churches.organizationId, ids))
      .groupBy(churches.organizationId),
    db
      .select({
        organizationId: churchMemberships.organizationId,
        value: sql<number>`count(distinct ${churchMemberships.userId})::int`,
      })
      .from(churchMemberships)
      .where(inArray(churchMemberships.organizationId, ids))
      .groupBy(churchMemberships.organizationId),
  ]);

  const churchCountByOrg = new Map(
    churchCountRows.map((row) => [row.organizationId, toInt(row.value)])
  );
  const memberCountByOrg = new Map(
    memberCountRows.map((row) => [row.organizationId, toInt(row.value)])
  );

  return {
    items: orgRows.map((row) => ({
      id: row.id,
      name: row.name,
      workspaceType: row.workspaceType,
      status: row.status,
      createdAt: row.createdAt,
      planId: row.planId,
      subscriptionStatus: row.subscriptionStatus,
      churchCount: churchCountByOrg.get(row.id) ?? 0,
      memberCount: memberCountByOrg.get(row.id) ?? 0,
    })),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function getSuperAdminOrganizationDetail(
  organizationId: string
): Promise<SuperAdminOrganizationDetail | null> {
  await requirePlatformSuperAdmin();

  const id = organizationId.trim();
  if (!isPostgresUuid(id)) return null;

  const [orgRow] = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      workspaceType: organizations.workspaceType,
      status: organizations.status,
      createdAt: organizations.createdAt,
      planId: subscriptions.planId,
      subscriptionStatus: subscriptions.status,
    })
    .from(organizations)
    .leftJoin(
      subscriptions,
      eq(subscriptions.organizationId, organizations.id)
    )
    .where(eq(organizations.id, id))
    .limit(1);

  if (!orgRow) return null;

  const [
    churchRows,
    memberByChurch,
    memberByStatus,
    memberTotal,
    songCount,
    sermonCount,
    articleCount,
    eventCount,
    prayerCount,
    donationCount,
    shortCount,
  ] = await Promise.all([
    db
      .select({
        id: churches.id,
        name: churches.name,
        isActive: churches.isActive,
        createdAt: churches.createdAt,
      })
      .from(churches)
      .where(eq(churches.organizationId, id))
      .orderBy(churches.name),
    db
      .select({
        churchId: churchMemberships.churchId,
        value: sql<number>`count(distinct ${churchMemberships.userId})::int`,
      })
      .from(churchMemberships)
      .where(eq(churchMemberships.organizationId, id))
      .groupBy(churchMemberships.churchId),
    db
      .select({
        status: churchMemberships.status,
        value: sql<number>`count(distinct ${churchMemberships.userId})::int`,
      })
      .from(churchMemberships)
      .where(eq(churchMemberships.organizationId, id))
      .groupBy(churchMemberships.status),
    db
      .select({
        value: sql<number>`count(distinct ${churchMemberships.userId})::int`,
      })
      .from(churchMemberships)
      .where(eq(churchMemberships.organizationId, id)),
    db.select({ value: count() }).from(songs).where(eq(songs.organizationId, id)),
    db
      .select({ value: count() })
      .from(sermons)
      .where(eq(sermons.organizationId, id)),
    db
      .select({ value: count() })
      .from(articles)
      .where(eq(articles.organizationId, id)),
    db
      .select({ value: count() })
      .from(events)
      .where(eq(events.organizationId, id)),
    db
      .select({ value: count() })
      .from(prayerRequests)
      .where(eq(prayerRequests.organizationId, id)),
    db
      .select({ value: count() })
      .from(donations)
      .where(eq(donations.organizationId, id)),
    db
      .select({ value: count() })
      .from(videoShorts)
      .where(eq(videoShorts.organizationId, id)),
  ]);

  const memberCountByChurch = new Map(
    memberByChurch.map((row) => [row.churchId, toInt(row.value)])
  );

  const byStatus = memberByStatus.map((row) => ({
    status: row.status,
    count: toInt(row.value),
  }));

  const countFor = (status: string) =>
    byStatus.find((row) => row.status === status)?.count ?? 0;

  return {
    organization: {
      id: orgRow.id,
      name: orgRow.name,
      workspaceType: orgRow.workspaceType,
      status: orgRow.status,
      createdAt: orgRow.createdAt,
      planId: orgRow.planId,
      subscriptionStatus: orgRow.subscriptionStatus,
    },
    churches: churchRows.map((church) => ({
      id: church.id,
      name: church.name,
      isActive: church.isActive,
      createdAt: church.createdAt,
      memberCount: memberCountByChurch.get(church.id) ?? 0,
    })),
    members: {
      total: toInt(memberTotal[0]?.value),
      active: countFor("active"),
      pending: countFor("pending"),
      suspended: countFor("suspended"),
      byStatus,
    },
    content: {
      songs: toInt(songCount[0]?.value),
      sermons: toInt(sermonCount[0]?.value),
      articles: toInt(articleCount[0]?.value),
      events: toInt(eventCount[0]?.value),
      prayerRequests: toInt(prayerCount[0]?.value),
      donations: toInt(donationCount[0]?.value),
      shorts: toInt(shortCount[0]?.value),
    },
  };
}

export const SUPER_ADMIN_LIST_PAGE_SIZE = ADMIN_PAGE_SIZE;

function churchListWhere(filters: SuperAdminChurchListFilters): SQL | undefined {
  const conditions: SQL[] = [];
  const q = filters.q?.trim();
  if (q) {
    conditions.push(ilike(churches.name, `%${escapeIlike(q)}%`));
  }
  if (filters.organizationId && isPostgresUuid(filters.organizationId)) {
    conditions.push(eq(churches.organizationId, filters.organizationId));
  }
  const orgQ = filters.organizationQ?.trim();
  if (orgQ) {
    conditions.push(ilike(organizations.name, `%${escapeIlike(orgQ)}%`));
  }
  if (filters.isActive === "true") {
    conditions.push(eq(churches.isActive, true));
  } else if (filters.isActive === "false") {
    conditions.push(eq(churches.isActive, false));
  }
  return conditions.length ? and(...conditions) : undefined;
}

export async function listSuperAdminChurches(
  filters: SuperAdminChurchListFilters
): Promise<SuperAdminChurchListResult> {
  await requirePlatformSuperAdmin();

  const pageSize = SUPER_ADMIN_LIST_PAGE_SIZE;
  const requestedPage = Math.max(1, filters.page ?? 1);
  const whereClause = churchListWhere(filters);

  const [totalRow] = await db
    .select({ value: count() })
    .from(churches)
    .innerJoin(organizations, eq(churches.organizationId, organizations.id))
    .where(whereClause);

  const total = toInt(totalRow?.value);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const offset = (page - 1) * pageSize;

  if (total === 0) {
    return { items: [], total: 0, page: 1, pageSize, totalPages: 1 };
  }

  const rows = await db
    .select({
      id: churches.id,
      name: churches.name,
      organizationId: churches.organizationId,
      organizationName: organizations.name,
      workspaceType: organizations.workspaceType,
      isActive: churches.isActive,
      createdAt: churches.createdAt,
    })
    .from(churches)
    .innerJoin(organizations, eq(churches.organizationId, organizations.id))
    .where(whereClause)
    .orderBy(desc(churches.createdAt))
    .limit(pageSize)
    .offset(offset);

  const ids = rows.map((row) => row.id);
  const memberCountRows = await db
    .select({
      churchId: churchMemberships.churchId,
      value: sql<number>`count(distinct ${churchMemberships.userId})::int`,
    })
    .from(churchMemberships)
    .where(inArray(churchMemberships.churchId, ids))
    .groupBy(churchMemberships.churchId);

  const memberCountByChurch = new Map(
    memberCountRows.map((row) => [row.churchId, toInt(row.value)])
  );

  return {
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      organizationId: row.organizationId,
      organizationName: row.organizationName,
      workspaceType: row.workspaceType,
      isActive: row.isActive,
      memberCount: memberCountByChurch.get(row.id) ?? 0,
      createdAt: row.createdAt,
    })),
    total,
    page,
    pageSize,
    totalPages,
  };
}

function memberListWhere(filters: SuperAdminMemberListFilters): SQL | undefined {
  const conditions: SQL[] = [];
  const q = filters.q?.trim();
  if (q) {
    const pattern = `%${escapeIlike(q)}%`;
    conditions.push(
      or(
        ilike(users.email, pattern),
        ilike(users.firstName, pattern),
        ilike(users.lastName, pattern)
      )!
    );
  }
  if (filters.organizationId && isPostgresUuid(filters.organizationId)) {
    conditions.push(eq(users.organizationId, filters.organizationId));
  }
  if (
    filters.platformRole === "user" ||
    filters.platformRole === "admin" ||
    filters.platformRole === "super_admin"
  ) {
    conditions.push(eq(users.platformRole, filters.platformRole));
  }
  if (filters.churchId && isPostgresUuid(filters.churchId)) {
    conditions.push(
      sql`exists (
        select 1 from ${churchMemberships}
        where ${churchMemberships.userId} = ${users.id}
          and ${churchMemberships.churchId} = ${filters.churchId}
      )`
    );
  }
  return conditions.length ? and(...conditions) : undefined;
}

function formatUserDisplayName(firstName: string, lastName: string, email: string) {
  const name = [firstName, lastName].map((part) => part.trim()).filter(Boolean).join(" ");
  return name || email;
}

export async function listSuperAdminMembers(
  filters: SuperAdminMemberListFilters
): Promise<SuperAdminMemberListResult> {
  await requirePlatformSuperAdmin();

  const pageSize = SUPER_ADMIN_LIST_PAGE_SIZE;
  const requestedPage = Math.max(1, filters.page ?? 1);
  const whereClause = memberListWhere(filters);

  const [totalRow] = await db
    .select({ value: count() })
    .from(users)
    .leftJoin(organizations, eq(users.organizationId, organizations.id))
    .where(whereClause);

  const total = toInt(totalRow?.value);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const offset = (page - 1) * pageSize;

  if (total === 0) {
    return { items: [], total: 0, page: 1, pageSize, totalPages: 1 };
  }

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      platformRole: users.platformRole,
      organizationName: organizations.name,
      createdAt: users.createdAt,
    })
    .from(users)
    .leftJoin(organizations, eq(users.organizationId, organizations.id))
    .where(whereClause)
    .orderBy(desc(users.createdAt))
    .limit(pageSize)
    .offset(offset);

  const userIds = rows.map((row) => row.id);
  const [churchMembershipRows, primaryMembershipRows] = await Promise.all([
    db
      .select({
        userId: churchMemberships.userId,
        churchName: churches.name,
      })
      .from(churchMemberships)
      .innerJoin(churches, eq(churchMemberships.churchId, churches.id))
      .where(inArray(churchMemberships.userId, userIds))
      .orderBy(churches.name),
    db
      .select({
        userId: churchMemberships.userId,
        status: churchMemberships.status,
      })
      .from(churchMemberships)
      .where(inArray(churchMemberships.userId, userIds))
      .orderBy(desc(churchMemberships.updatedAt)),
  ]);

  const churchesByUser = new Map<string, string[]>();
  for (const row of churchMembershipRows) {
    const existing = churchesByUser.get(row.userId) ?? [];
    if (!existing.includes(row.churchName)) {
      existing.push(row.churchName);
    }
    churchesByUser.set(row.userId, existing);
  }

  const statusByUser = new Map<string, string>();
  for (const row of primaryMembershipRows) {
    if (!statusByUser.has(row.userId)) {
      statusByUser.set(row.userId, row.status);
    }
  }

  return {
    items: rows.map((row) => ({
      id: row.id,
      email: row.email,
      displayName: formatUserDisplayName(row.firstName, row.lastName, row.email),
      platformRole: row.platformRole,
      organizationName: row.organizationName,
      churchNames: churchesByUser.get(row.id) ?? [],
      membershipStatus: statusByUser.get(row.id) ?? null,
      createdAt: row.createdAt,
    })),
    total,
    page,
    pageSize,
    totalPages,
  };
}

function subscriptionListWhere(
  filters: SuperAdminSubscriptionListFilters
): SQL | undefined {
  const conditions: SQL[] = [];
  const q = filters.q?.trim();
  if (q) {
    conditions.push(ilike(organizations.name, `%${escapeIlike(q)}%`));
  }
  if (
    filters.planId === "free" ||
    filters.planId === "starter" ||
    filters.planId === "professional" ||
    filters.planId === "enterprise"
  ) {
    conditions.push(eq(subscriptions.planId, filters.planId));
  }
  if (
    filters.subscriptionStatus === "active" ||
    filters.subscriptionStatus === "trialing" ||
    filters.subscriptionStatus === "past_due" ||
    filters.subscriptionStatus === "canceled" ||
    filters.subscriptionStatus === "incomplete"
  ) {
    conditions.push(eq(subscriptions.status, filters.subscriptionStatus));
  }
  if (
    filters.organizationAccess === "active" ||
    filters.organizationAccess === "suspended" ||
    filters.organizationAccess === "trial"
  ) {
    conditions.push(eq(organizations.status, filters.organizationAccess));
  }
  return conditions.length ? and(...conditions) : undefined;
}

export async function listSuperAdminSubscriptions(
  filters: SuperAdminSubscriptionListFilters
): Promise<SuperAdminSubscriptionListResult> {
  await requirePlatformSuperAdmin();

  const pageSize = SUPER_ADMIN_LIST_PAGE_SIZE;
  const requestedPage = Math.max(1, filters.page ?? 1);
  const whereClause = subscriptionListWhere(filters);

  const [totalRow] = await db
    .select({ value: count() })
    .from(subscriptions)
    .innerJoin(organizations, eq(subscriptions.organizationId, organizations.id))
    .where(whereClause);

  const total = toInt(totalRow?.value);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const offset = (page - 1) * pageSize;

  if (total === 0) {
    return { items: [], total: 0, page: 1, pageSize, totalPages: 1 };
  }

  const rows = await db
    .select({
      id: subscriptions.id,
      organizationId: subscriptions.organizationId,
      organizationName: organizations.name,
      planId: subscriptions.planId,
      subscriptionStatus: subscriptions.status,
      organizationAccess: organizations.status,
      currentPeriodStart: subscriptions.currentPeriodStart,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      createdAt: subscriptions.createdAt,
    })
    .from(subscriptions)
    .innerJoin(organizations, eq(subscriptions.organizationId, organizations.id))
    .where(whereClause)
    .orderBy(desc(subscriptions.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    items: rows.map((row) => ({
      id: row.id,
      organizationId: row.organizationId,
      organizationName: row.organizationName,
      planId: row.planId,
      subscriptionStatus: row.subscriptionStatus,
      organizationAccess: row.organizationAccess,
      currentPeriodStart: row.currentPeriodStart,
      currentPeriodEnd: row.currentPeriodEnd,
      createdAt: row.createdAt,
    })),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function searchSuperAdminPlatform(
  query: string
): Promise<SuperAdminSearchResult> {
  const q = query.trim();
  if (!q) {
    return { organizations: [], churches: [], members: [] };
  }

  const [organizationsResult, churchesResult, membersResult] = await Promise.all([
    listSuperAdminOrganizations({ q, page: 1 }),
    listSuperAdminChurches({ q, page: 1 }),
    listSuperAdminMembers({ q, page: 1 }),
  ]);

  return {
    organizations: organizationsResult.items.slice(0, 5),
    churches: churchesResult.items.slice(0, 5),
    members: membersResult.items.slice(0, 5),
  };
}
