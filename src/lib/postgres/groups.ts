import "server-only";

import { randomBytes } from "crypto";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  churchGroupInvitations,
  churchGroupMemberships,
  churchGroups,
  churchMemberships,
  users,
} from "@/db/schema";
import { createUserNotifications } from "@/lib/postgres/features";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import {
  userCanAccessChurchContent,
  userCanManageChurch,
} from "@/lib/postgres/session";
import { getChurchById, getChurchRowById } from "@/lib/postgres/tenants";
import { isPostgresUuid } from "@/lib/postgres/uuid";
import { EmailService } from "@/lib/email/email-service";
import { getStorageObjectKeyFromUrl } from "@/lib/supabase-storage";
import type {
  ChurchGroupDetail,
  ChurchGroupInviteCandidate,
  ChurchGroupMember,
  ChurchGroupMemberRole,
  ChurchGroupSummary,
} from "@/types/church-group";

type GroupRow = typeof churchGroups.$inferSelect;

function generateInviteToken(): string {
  return randomBytes(32).toString("hex");
}

function displayName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  email: string
): string {
  const name = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return name || email;
}

function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

export class GroupAccessError extends Error {
  constructor(
    message: string,
    readonly code:
      | "forbidden"
      | "not_found"
      | "already_member"
      | "invitation_pending"
      | "not_church_member"
      | "invalid"
      | "owner_protected"
  ) {
    super(message);
    this.name = "GroupAccessError";
  }
}

async function requireAppUser(clerkId: string) {
  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser) {
    throw new GroupAccessError("Unauthorized", "forbidden");
  }
  return appUser;
}

async function loadGroupById(groupId: string): Promise<GroupRow | null> {
  if (!isPostgresUuid(groupId)) return null;
  const [row] = await db
    .select()
    .from(churchGroups)
    .where(eq(churchGroups.id, groupId))
    .limit(1);
  return row ?? null;
}

async function requireVisibleGroup(input: {
  groupId: string;
  clerkId: string;
  email?: string;
  manage?: boolean;
}): Promise<GroupRow> {
  const group = await loadGroupById(input.groupId);
  if (!group || group.status === "archived") {
    throw new GroupAccessError("Not found", "not_found");
  }

  const canAccess = await userCanAccessChurchContent(
    input.clerkId,
    input.email,
    group.churchId
  );
  if (!canAccess) {
    throw new GroupAccessError("Not found", "not_found");
  }

  if (input.manage) {
    const canManage = await userCanManageChurch(
      input.clerkId,
      input.email,
      group.churchId
    );
    if (!canManage) {
      throw new GroupAccessError("Forbidden", "forbidden");
    }
  }

  return group;
}

async function requireGroupMemberManage(input: {
  groupId: string;
  clerkId: string;
  email?: string;
}): Promise<{ group: GroupRow; membershipRole: ChurchGroupMemberRole | null }> {
  const group = await requireVisibleGroup(input);
  const churchManage = await userCanManageChurch(
    input.clerkId,
    input.email,
    group.churchId
  );
  const appUser = await requireAppUser(input.clerkId);
  const mine = await membershipRow(group.id, appUser.id);
  const membershipRole = (mine?.role ?? null) as ChurchGroupMemberRole | null;
  if (churchManage || membershipRole === "owner" || membershipRole === "admin") {
    return { group, membershipRole };
  }
  throw new GroupAccessError("Forbidden", "forbidden");
}

async function requireGroupEditor(input: {
  groupId: string;
  clerkId: string;
  email?: string;
}): Promise<GroupRow> {
  const group = await requireVisibleGroup(input);
  const churchManage = await userCanManageChurch(
    input.clerkId,
    input.email,
    group.churchId
  );
  if (churchManage) return group;
  const appUser = await requireAppUser(input.clerkId);
  const mine = await membershipRow(group.id, appUser.id);
  if (mine?.role === "owner") return group;
  throw new GroupAccessError("Forbidden", "forbidden");
}

export async function userCanUploadGroupImage(
  clerkId: string,
  email: string | undefined,
  groupId: string
): Promise<boolean> {
  try {
    await requireGroupEditor({ clerkId, email, groupId });
    return true;
  } catch (error) {
    if (error instanceof GroupAccessError) return false;
    throw error;
  }
}

function isValidGroupImageUrl(url: string, groupId: string) {
  const key = getStorageObjectKeyFromUrl(url);
  return Boolean(
    key &&
      key.startsWith(`groups/${groupId}/`) &&
      !key.includes("..")
  );
}

async function pendingInvitationCount(groupId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(churchGroupInvitations)
    .where(
      and(
        eq(churchGroupInvitations.groupId, groupId),
        eq(churchGroupInvitations.status, "pending")
      )
    );
  return Number(row?.count ?? 0);
}

async function createdByDisplayName(userId: string | null): Promise<string> {
  if (!userId) return "Unknown";
  const [row] = await db
    .select({
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row) return "Unknown";
  return displayName(row.firstName, row.lastName, row.email);
}

async function isActiveChurchMember(
  userId: string,
  churchId: string,
  organizationId: string
) {
  const [row] = await db
    .select({ id: churchMemberships.id })
    .from(churchMemberships)
    .where(
      and(
        eq(churchMemberships.userId, userId),
        eq(churchMemberships.churchId, churchId),
        eq(churchMemberships.organizationId, organizationId),
        eq(churchMemberships.status, "active")
      )
    )
    .limit(1);
  return Boolean(row);
}

export async function userIsApprovedChurchMember(
  clerkId: string,
  churchId: string,
  organizationId: string
): Promise<boolean> {
  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser) return false;
  return isActiveChurchMember(appUser.id, churchId, organizationId);
}

function isUniqueViolation(error: unknown) {
  let current: unknown = error;
  for (let i = 0; i < 6 && current; i += 1) {
    if (typeof current !== "object" || current === null) break;
    const record = current as { code?: unknown; cause?: unknown };
    if (record.code === "23505") return true;
    current = record.cause;
  }
  return false;
}

async function memberCount(groupId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(churchGroupMemberships)
    .where(eq(churchGroupMemberships.groupId, groupId));
  return Number(row?.count ?? 0);
}

async function membershipRow(groupId: string, userId: string) {
  const [row] = await db
    .select()
    .from(churchGroupMemberships)
    .where(
      and(
        eq(churchGroupMemberships.groupId, groupId),
        eq(churchGroupMemberships.userId, userId)
      )
    )
    .limit(1);
  return row ?? null;
}

async function pendingInvitation(groupId: string, userId: string) {
  const [row] = await db
    .select()
    .from(churchGroupInvitations)
    .where(
      and(
        eq(churchGroupInvitations.groupId, groupId),
        eq(churchGroupInvitations.userId, userId),
        eq(churchGroupInvitations.status, "pending")
      )
    )
    .limit(1);
  return row ?? null;
}

function toSummary(
  group: GroupRow,
  extra: {
    churchName: string;
    memberCount: number;
    isMember: boolean;
    pendingInvitationId: string | null;
    canManage: boolean;
    canManageMembers: boolean;
    myRole: ChurchGroupMemberRole | null;
    createdByName: string;
  }
): ChurchGroupSummary {
  return {
    id: group.id,
    organizationId: group.organizationId,
    churchId: group.churchId,
    churchName: extra.churchName,
    name: group.name,
    description: group.description,
    imageUrl: group.imageUrl,
    status: group.status,
    memberCount: extra.memberCount,
    isMember: extra.isMember,
    pendingInvitationId: extra.pendingInvitationId,
    canManage: extra.canManage,
    canManageMembers: extra.canManageMembers,
    myRole: extra.myRole,
    createdByUserId: group.createdBy,
    createdByName: extra.createdByName,
    createdAt: group.createdAt.toISOString(),
    updatedAt: group.updatedAt.toISOString(),
  };
}

export async function listChurchGroups(input: {
  clerkId: string;
  email?: string;
  churchId: string;
}): Promise<ChurchGroupSummary[]> {
  if (!isPostgresUuid(input.churchId)) return [];

  const canAccess = await userCanAccessChurchContent(
    input.clerkId,
    input.email,
    input.churchId
  );
  if (!canAccess) {
    throw new GroupAccessError("Not found", "not_found");
  }

  const church = await getChurchById(input.churchId);
  if (!church?.organizationId) {
    throw new GroupAccessError("Not found", "not_found");
  }

  const appUser = await requireAppUser(input.clerkId);
  const canManage = await userCanManageChurch(
    input.clerkId,
    input.email,
    church.id
  );

  const groups = await db
    .select()
    .from(churchGroups)
    .where(
      and(
        eq(churchGroups.churchId, church.id),
        eq(churchGroups.organizationId, church.organizationId),
        eq(churchGroups.status, "active")
      )
    )
    .orderBy(desc(churchGroups.createdAt))
    .limit(100);

  if (groups.length === 0) return [];

  const groupIds = groups.map((group) => group.id);
  const counts = await db
    .select({
      groupId: churchGroupMemberships.groupId,
      count: sql<number>`count(*)::int`,
    })
    .from(churchGroupMemberships)
    .where(inArray(churchGroupMemberships.groupId, groupIds))
    .groupBy(churchGroupMemberships.groupId);

  const countMap = new Map(
    counts.map((row) => [row.groupId, Number(row.count)])
  );

  const myMemberships = await db
    .select({
      groupId: churchGroupMemberships.groupId,
      role: churchGroupMemberships.role,
    })
    .from(churchGroupMemberships)
    .where(eq(churchGroupMemberships.userId, appUser.id));
  const memberMap = new Map(
    myMemberships.map((row) => [row.groupId, row.role as ChurchGroupMemberRole])
  );

  const myInvites = await db
    .select({
      id: churchGroupInvitations.id,
      groupId: churchGroupInvitations.groupId,
    })
    .from(churchGroupInvitations)
    .where(
      and(
        eq(churchGroupInvitations.userId, appUser.id),
        eq(churchGroupInvitations.status, "pending")
      )
    );
  const inviteMap = new Map(myInvites.map((row) => [row.groupId, row.id]));

  const creatorIds = [
    ...new Set(
      groups
        .map((group) => group.createdBy)
        .filter((id): id is string => Boolean(id))
    ),
  ];
  const creatorRows =
    creatorIds.length === 0
      ? []
      : await db
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          })
          .from(users)
          .where(inArray(users.id, creatorIds));
  const creatorNameMap = new Map(
    creatorRows.map((row) => [
      row.id,
      displayName(row.firstName, row.lastName, row.email),
    ])
  );

  const churchName = church.name.trim() || "Church";
  return groups.map((group) => {
    const myRole = memberMap.get(group.id) ?? null;
    const canManageMembers =
      canManage || myRole === "owner" || myRole === "admin";
    return toSummary(group, {
      churchName,
      memberCount: countMap.get(group.id) ?? 0,
      isMember: memberMap.has(group.id),
      pendingInvitationId: inviteMap.get(group.id) ?? null,
      canManage,
      canManageMembers,
      myRole,
      createdByName: group.createdBy
        ? (creatorNameMap.get(group.createdBy) ?? "Unknown")
        : "Unknown",
    });
  });
}

export async function createChurchGroup(input: {
  clerkId: string;
  email?: string;
  churchId: string;
  name: string;
  description?: string;
}): Promise<ChurchGroupSummary> {
  const name = input.name.trim();
  if (!name) {
    throw new GroupAccessError("Group name is required.", "invalid");
  }
  if (!isPostgresUuid(input.churchId)) {
    throw new GroupAccessError("No active church context", "invalid");
  }

  const canManage = await userCanManageChurch(
    input.clerkId,
    input.email,
    input.churchId
  );
  if (!canManage) {
    throw new GroupAccessError("Forbidden", "forbidden");
  }

  const church = await getChurchById(input.churchId);
  if (!church?.organizationId) {
    throw new GroupAccessError("Not found", "not_found");
  }

  const appUser = await requireAppUser(input.clerkId);
  const [inserted] = await db
    .insert(churchGroups)
    .values({
      organizationId: church.organizationId,
      churchId: church.id,
      name,
      description: input.description?.trim() ?? "",
      inviteToken: generateInviteToken(),
      createdBy: appUser.id,
      status: "active",
    })
    .returning();

  if (!inserted) {
    throw new GroupAccessError("Failed to create group.", "invalid");
  }

  await db.insert(churchGroupMemberships).values({
    organizationId: church.organizationId,
    churchId: church.id,
    groupId: inserted.id,
    userId: appUser.id,
    role: "owner",
  });

  return toSummary(inserted, {
    churchName: church.name.trim() || "Church",
    memberCount: 1,
    isMember: true,
    pendingInvitationId: null,
    canManage: true,
    canManageMembers: true,
    myRole: "owner",
    createdByName: displayName(appUser.firstName, appUser.lastName, appUser.email),
  });
}

export async function getChurchGroupDetail(input: {
  clerkId: string;
  email?: string;
  groupId: string;
}): Promise<ChurchGroupDetail> {
  const group = await requireVisibleGroup(input);
  const appUser = await requireAppUser(input.clerkId);
  const church = await getChurchById(group.churchId);
  const canManage = await userCanManageChurch(
    input.clerkId,
    input.email,
    group.churchId
  );
  const mine = await membershipRow(group.id, appUser.id);
  const myRole = (mine?.role ?? null) as ChurchGroupMemberRole | null;
  const pending = mine ? null : await pendingInvitation(group.id, appUser.id);
  const count = await memberCount(group.id);
  const canManageMembers =
    canManage || myRole === "owner" || myRole === "admin";
  const createdByName = await createdByDisplayName(group.createdBy);

  const members: ChurchGroupMember[] = [];
  if (mine || canManage || canManageMembers) {
    const rows = await db
      .select({
        userId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: churchGroupMemberships.role,
        joinedAt: churchGroupMemberships.createdAt,
      })
      .from(churchGroupMemberships)
      .innerJoin(users, eq(users.id, churchGroupMemberships.userId))
      .where(eq(churchGroupMemberships.groupId, group.id))
      .orderBy(users.firstName, users.lastName)
      .limit(200);
    for (const row of rows) {
      members.push({
        userId: row.userId,
        firstName: row.firstName,
        lastName: row.lastName,
        displayName: displayName(row.firstName, row.lastName, row.email),
        email: row.email,
        role: row.role as ChurchGroupMemberRole,
        joinedAt: row.joinedAt.toISOString(),
      });
    }
  }

  return {
    ...toSummary(group, {
      churchName: church?.name.trim() || "Church",
      memberCount: count,
      isMember: Boolean(mine),
      pendingInvitationId: pending?.id ?? null,
      canManage,
      canManageMembers,
      myRole,
      createdByName,
    }),
    members,
    inviteToken: canManageMembers ? group.inviteToken : undefined,
    pendingInvitationCount: canManageMembers
      ? await pendingInvitationCount(group.id)
      : 0,
  };
}

export async function updateChurchGroup(input: {
  clerkId: string;
  email?: string;
  groupId: string;
  name?: string;
  description?: string;
  imageUrl?: string | null;
}): Promise<ChurchGroupSummary> {
  const group = await requireGroupEditor(input);
  const name = input.name?.trim();
  if (name !== undefined && !name) {
    throw new GroupAccessError("Group name is required.", "invalid");
  }

  let nextImageUrl = group.imageUrl;
  if (input.imageUrl === null) {
    nextImageUrl = null;
  } else if (typeof input.imageUrl === "string") {
    const trimmed = input.imageUrl.trim();
    if (!trimmed) {
      nextImageUrl = null;
    } else if (!isValidGroupImageUrl(trimmed, group.id)) {
      throw new GroupAccessError("Invalid group image.", "invalid");
    } else {
      nextImageUrl = trimmed;
    }
  }

  const [updated] = await db
    .update(churchGroups)
    .set({
      name: name ?? group.name,
      description:
        input.description !== undefined
          ? input.description.trim()
          : group.description,
      imageUrl: nextImageUrl,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(churchGroups.id, group.id),
        eq(churchGroups.organizationId, group.organizationId)
      )
    )
    .returning();

  if (!updated) {
    throw new GroupAccessError("Not found", "not_found");
  }

  const church = await getChurchById(updated.churchId);
  const appUser = await requireAppUser(input.clerkId);
  const mine = await membershipRow(updated.id, appUser.id);
  const myRole = (mine?.role ?? null) as ChurchGroupMemberRole | null;
  const churchManage = await userCanManageChurch(
    input.clerkId,
    input.email,
    updated.churchId
  );
  return toSummary(updated, {
    churchName: church?.name.trim() || "Church",
    memberCount: await memberCount(updated.id),
    isMember: Boolean(mine),
    pendingInvitationId: null,
    canManage: churchManage,
    canManageMembers:
      churchManage || myRole === "owner" || myRole === "admin",
    myRole,
    createdByName: await createdByDisplayName(updated.createdBy),
  });
}

export async function archiveChurchGroup(input: {
  clerkId: string;
  email?: string;
  groupId: string;
}): Promise<void> {
  const group = await requireVisibleGroup({ ...input, manage: true });
  await db
    .update(churchGroups)
    .set({ status: "archived", updatedAt: new Date() })
    .where(
      and(
        eq(churchGroups.id, group.id),
        eq(churchGroups.organizationId, group.organizationId)
      )
    );
}

export async function regenerateGroupInviteToken(input: {
  clerkId: string;
  email?: string;
  groupId: string;
}): Promise<string> {
  const group = await requireGroupMemberManage(input).then((r) => r.group);
  const token = generateInviteToken();
  const [updated] = await db
    .update(churchGroups)
    .set({ inviteToken: token, updatedAt: new Date() })
    .where(
      and(
        eq(churchGroups.id, group.id),
        eq(churchGroups.organizationId, group.organizationId)
      )
    )
    .returning({ inviteToken: churchGroups.inviteToken });
  if (!updated) {
    throw new GroupAccessError("Not found", "not_found");
  }
  return updated.inviteToken;
}

export async function searchGroupInviteCandidates(input: {
  clerkId: string;
  email?: string;
  groupId: string;
  query: string;
}): Promise<ChurchGroupInviteCandidate[]> {
  const { group } = await requireGroupMemberManage(input);
  const query = input.query.trim().slice(0, 80);

  const baseConditions = and(
    eq(churchMemberships.churchId, group.churchId),
    eq(churchMemberships.organizationId, group.organizationId),
    eq(churchMemberships.status, "active")
  );

  const searchConditions =
    query.length > 0
      ? and(
          baseConditions,
          or(
            ilike(
              users.email,
              `%${escapeLikePattern(query)}%`
            ),
            ilike(users.firstName, `%${escapeLikePattern(query)}%`),
            ilike(users.lastName, `%${escapeLikePattern(query)}%`),
            sql`concat_ws(' ', ${users.firstName}, ${users.lastName}) ilike ${`%${escapeLikePattern(query)}%`}`
          )
        )
      : baseConditions;

  const rows = await db
    .select({
      userId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(churchMemberships)
    .innerJoin(users, eq(users.id, churchMemberships.userId))
    .where(searchConditions)
    .orderBy(users.firstName, users.lastName)
    .limit(20);

  if (rows.length === 0) return [];

  const memberRows = await db
    .select({ userId: churchGroupMemberships.userId })
    .from(churchGroupMemberships)
    .where(eq(churchGroupMemberships.groupId, group.id));
  const memberSet = new Set(memberRows.map((row) => row.userId));

  const pendingRows = await db
    .select({ userId: churchGroupInvitations.userId })
    .from(churchGroupInvitations)
    .where(
      and(
        eq(churchGroupInvitations.groupId, group.id),
        eq(churchGroupInvitations.status, "pending")
      )
    );
  const pendingSet = new Set(pendingRows.map((row) => row.userId));

  return rows.map((row) => ({
    userId: row.userId,
    firstName: row.firstName,
    lastName: row.lastName,
    displayName: displayName(row.firstName, row.lastName, row.email),
    email: row.email,
    state: memberSet.has(row.userId)
      ? "member"
      : pendingSet.has(row.userId)
        ? "pending"
        : "invite",
  }));
}

export async function inviteChurchMemberToGroup(input: {
  clerkId: string;
  email?: string;
  groupId: string;
  inviteeUserId: string;
}): Promise<{ invitationId: string }> {
  const { group } = await requireGroupMemberManage(input);
  if (!isPostgresUuid(input.inviteeUserId)) {
    throw new GroupAccessError("Invalid member.", "invalid");
  }

  const inChurch = await isActiveChurchMember(
    input.inviteeUserId,
    group.churchId,
    group.organizationId
  );
  if (!inChurch) {
    throw new GroupAccessError("Not found", "not_found");
  }

  const existingMember = await membershipRow(group.id, input.inviteeUserId);
  if (existingMember) {
    throw new GroupAccessError("Already a member", "already_member");
  }

  const existingInvite = await pendingInvitation(group.id, input.inviteeUserId);
  if (existingInvite) {
    throw new GroupAccessError(
      "Invitation already pending",
      "invitation_pending"
    );
  }

  const inviter = await requireAppUser(input.clerkId);
  try {
    const [inserted] = await db
      .insert(churchGroupInvitations)
      .values({
        organizationId: group.organizationId,
        churchId: group.churchId,
        groupId: group.id,
        userId: input.inviteeUserId,
        invitedBy: inviter.id,
        status: "pending",
      })
      .returning({ id: churchGroupInvitations.id });

    if (!inserted) {
      throw new GroupAccessError(
        "Invitation already pending",
        "invitation_pending"
      );
    }

    const church = await getChurchById(group.churchId);
    const churchName = church?.name.trim() || "your church";
    const inviterName = displayName(
      inviter.firstName,
      inviter.lastName,
      inviter.email
    );

    if (inviter.id !== input.inviteeUserId) {
      try {
        await createUserNotifications({
          userIds: [input.inviteeUserId],
          type: "group_invitation",
          churchId: group.churchId,
          organizationId: group.organizationId,
          title: `You've been invited to ${group.name}`,
          message: `${inviterName} invited you to join ${group.name} at ${churchName}.`,
          contentTitle: group.name,
          contentId: group.id,
        });
      } catch (error) {
        console.error("[groups] invitation notification failed", error);
      }

      try {
        const [invitee] = await db
          .select({
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
          })
          .from(users)
          .where(eq(users.id, input.inviteeUserId))
          .limit(1);
        if (invitee?.email) {
          await EmailService.sendGroupInvitation({
            to: invitee.email,
            userName: displayName(
              invitee.firstName,
              invitee.lastName,
              invitee.email
            ),
            inviterName,
            groupName: group.name,
            churchName,
            groupId: group.id,
          });
        }
      } catch (error) {
        console.error("[groups] invitation email failed", error);
      }
    }

    return { invitationId: inserted.id };
  } catch (error) {
    if (error instanceof GroupAccessError) throw error;
    if (isUniqueViolation(error)) {
      throw new GroupAccessError(
        "Invitation already pending",
        "invitation_pending"
      );
    }
    throw error;
  }
}

async function addMembershipIfMissing(group: GroupRow, userId: string) {
  await db
    .insert(churchGroupMemberships)
    .values({
      organizationId: group.organizationId,
      churchId: group.churchId,
      groupId: group.id,
      userId,
      role: "member",
    })
    .onConflictDoNothing();
}

export async function respondToGroupInvitation(input: {
  clerkId: string;
  email?: string;
  invitationId: string;
  action: "accept" | "decline";
}): Promise<{ groupId: string; joined: boolean }> {
  if (!isPostgresUuid(input.invitationId)) {
    throw new GroupAccessError("Not found", "not_found");
  }

  const appUser = await requireAppUser(input.clerkId);
  const [invite] = await db
    .select()
    .from(churchGroupInvitations)
    .where(eq(churchGroupInvitations.id, input.invitationId))
    .limit(1);
  if (!invite || invite.userId !== appUser.id) {
    throw new GroupAccessError("Not found", "not_found");
  }

  const group = await loadGroupById(invite.groupId);
  if (!group || group.status === "archived") {
    throw new GroupAccessError("Not found", "not_found");
  }
  if (group.organizationId !== invite.organizationId) {
    throw new GroupAccessError("Not found", "not_found");
  }

  const canJoin = await isActiveChurchMember(
    appUser.id,
    group.churchId,
    group.organizationId
  );
  if (!canJoin) {
    throw new GroupAccessError(
      "You must be a church member to join this group.",
      "not_church_member"
    );
  }

  if (input.action === "decline") {
    if (invite.status === "pending") {
      await db
        .update(churchGroupInvitations)
        .set({
          status: "declined",
          respondedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(churchGroupInvitations.id, invite.id),
            eq(churchGroupInvitations.userId, appUser.id)
          )
        );
    }
    return { groupId: group.id, joined: false };
  }

  await addMembershipIfMissing(group, appUser.id);
  if (invite.status === "pending") {
    await db
      .update(churchGroupInvitations)
      .set({
        status: "accepted",
        respondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(churchGroupInvitations.id, invite.id),
          eq(churchGroupInvitations.userId, appUser.id)
        )
      );
  }

  return { groupId: group.id, joined: true };
}

export async function getGroupPreviewByToken(token: string): Promise<{
  groupId: string;
  name: string;
  description: string;
  imageUrl: string | null;
  churchName: string;
  churchJoinSlug: string;
  churchId: string;
  organizationId: string;
} | null> {
  const trimmed = token.trim();
  if (!trimmed || trimmed.length < 16 || trimmed.length > 128) return null;
  if (!/^[a-f0-9]+$/i.test(trimmed)) return null;
  const [group] = await db
    .select()
    .from(churchGroups)
    .where(
      and(
        eq(churchGroups.inviteToken, trimmed),
        eq(churchGroups.status, "active")
      )
    )
    .limit(1);
  if (!group) return null;
  const church = await getChurchRowById(group.churchId);
  if (!church) return null;
  return {
    groupId: group.id,
    name: group.name,
    description: group.description,
    imageUrl: group.imageUrl,
    churchName: church.name.trim() || "Church",
    churchJoinSlug: church.joinSlug,
    churchId: church.id,
    organizationId: group.organizationId,
  };
}

export async function joinGroupByInviteToken(input: {
  clerkId: string;
  email?: string;
  token: string;
}): Promise<{ groupId: string; alreadyMember: boolean }> {
  const preview = await getGroupPreviewByToken(input.token);
  if (!preview) {
    throw new GroupAccessError("Not found", "not_found");
  }

  const appUser = await requireAppUser(input.clerkId);
  const canJoin = await isActiveChurchMember(
    appUser.id,
    preview.churchId,
    preview.organizationId
  );
  if (!canJoin) {
    throw new GroupAccessError(
      "You must be a church member to join this group.",
      "not_church_member"
    );
  }

  const group = await loadGroupById(preview.groupId);
  if (!group || group.status !== "active") {
    throw new GroupAccessError("Not found", "not_found");
  }
  if (group.organizationId !== preview.organizationId) {
    throw new GroupAccessError("Not found", "not_found");
  }
  const existing = await membershipRow(group.id, appUser.id);
  if (existing) {
    return { groupId: group.id, alreadyMember: true };
  }

  await addMembershipIfMissing(group, appUser.id);

  const pending = await pendingInvitation(group.id, appUser.id);
  if (pending) {
    await db
      .update(churchGroupInvitations)
      .set({
        status: "accepted",
        respondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(churchGroupInvitations.id, pending.id));
  }

  return { groupId: group.id, alreadyMember: false };
}

export async function leaveChurchGroup(input: {
  clerkId: string;
  email?: string;
  groupId: string;
}): Promise<void> {
  const group = await requireVisibleGroup(input);
  const appUser = await requireAppUser(input.clerkId);
  const mine = await membershipRow(group.id, appUser.id);
  if (!mine) return;
  if (mine.role === "owner") {
    throw new GroupAccessError(
      "Transfer ownership before leaving this group.",
      "owner_protected"
    );
  }
  await db
    .delete(churchGroupMemberships)
    .where(
      and(
        eq(churchGroupMemberships.groupId, group.id),
        eq(churchGroupMemberships.userId, appUser.id),
        eq(churchGroupMemberships.organizationId, group.organizationId)
      )
    );
}

export async function removeChurchGroupMember(input: {
  clerkId: string;
  email?: string;
  groupId: string;
  memberUserId: string;
}): Promise<void> {
  const { group, membershipRole } = await requireGroupMemberManage(input);
  if (!isPostgresUuid(input.memberUserId)) {
    throw new GroupAccessError("Not found", "not_found");
  }

  const target = await membershipRow(group.id, input.memberUserId);
  if (!target) {
    throw new GroupAccessError("Not found", "not_found");
  }
  if (target.role === "owner") {
    throw new GroupAccessError(
      "The group owner cannot be removed.",
      "owner_protected"
    );
  }

  const churchManage = await userCanManageChurch(
    input.clerkId,
    input.email,
    group.churchId
  );
  if (
    target.role === "admin" &&
    !churchManage &&
    membershipRole !== "owner"
  ) {
    throw new GroupAccessError("Forbidden", "forbidden");
  }

  await db
    .delete(churchGroupMemberships)
    .where(
      and(
        eq(churchGroupMemberships.groupId, group.id),
        eq(churchGroupMemberships.userId, input.memberUserId),
        eq(churchGroupMemberships.organizationId, group.organizationId)
      )
    );
}

export async function updateChurchGroupMemberRole(input: {
  clerkId: string;
  email?: string;
  groupId: string;
  memberUserId: string;
  role: "admin" | "member";
}): Promise<ChurchGroupMemberRole> {
  const { group, membershipRole } = await requireGroupMemberManage(input);
  if (!isPostgresUuid(input.memberUserId)) {
    throw new GroupAccessError("Not found", "not_found");
  }

  const target = await membershipRow(group.id, input.memberUserId);
  if (!target) {
    throw new GroupAccessError("Not found", "not_found");
  }
  if (target.role === "owner") {
    throw new GroupAccessError(
      "Owner role cannot be changed this way. Transfer ownership instead.",
      "owner_protected"
    );
  }

  const churchManage = await userCanManageChurch(
    input.clerkId,
    input.email,
    group.churchId
  );
  const actorIsOwner = membershipRole === "owner" || churchManage;
  if (!actorIsOwner && target.role === "admin") {
    throw new GroupAccessError("Forbidden", "forbidden");
  }
  if (!actorIsOwner && membershipRole !== "admin") {
    throw new GroupAccessError("Forbidden", "forbidden");
  }

  const [updated] = await db
    .update(churchGroupMemberships)
    .set({ role: input.role, updatedAt: new Date() })
    .where(
      and(
        eq(churchGroupMemberships.groupId, group.id),
        eq(churchGroupMemberships.userId, input.memberUserId),
        eq(churchGroupMemberships.organizationId, group.organizationId)
      )
    )
    .returning({ role: churchGroupMemberships.role });

  if (!updated) {
    throw new GroupAccessError("Not found", "not_found");
  }
  return updated.role as ChurchGroupMemberRole;
}

export async function transferChurchGroupOwnership(input: {
  clerkId: string;
  email?: string;
  groupId: string;
  memberUserId: string;
}): Promise<void> {
  const group = await requireVisibleGroup(input);
  const appUser = await requireAppUser(input.clerkId);
  const mine = await membershipRow(group.id, appUser.id);
  if (mine?.role !== "owner") {
    throw new GroupAccessError("Forbidden", "forbidden");
  }
  if (!isPostgresUuid(input.memberUserId) || input.memberUserId === appUser.id) {
    throw new GroupAccessError("Select another member.", "invalid");
  }

  const target = await membershipRow(group.id, input.memberUserId);
  if (!target) {
    throw new GroupAccessError("Not found", "not_found");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(churchGroupMemberships)
      .set({ role: "admin", updatedAt: new Date() })
      .where(
        and(
          eq(churchGroupMemberships.groupId, group.id),
          eq(churchGroupMemberships.userId, appUser.id)
        )
      );
    await tx
      .update(churchGroupMemberships)
      .set({ role: "owner", updatedAt: new Date() })
      .where(
        and(
          eq(churchGroupMemberships.groupId, group.id),
          eq(churchGroupMemberships.userId, input.memberUserId)
        )
      );
    await tx
      .update(churchGroups)
      .set({ createdBy: input.memberUserId, updatedAt: new Date() })
      .where(eq(churchGroups.id, group.id));
  });
}
