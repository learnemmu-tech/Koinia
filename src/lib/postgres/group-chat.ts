import "server-only";

import { and, asc, desc, eq, inArray, isNull, lt, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  churchGroupMemberships,
  churchGroupMessageReactions,
  churchGroupMessageReports,
  churchGroupMessages,
  churchGroups,
  users,
} from "@/db/schema";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import { getChurchMembershipRow } from "@/lib/postgres/session";
import { isPostgresUuid } from "@/lib/postgres/uuid";
import {
  COMMUNITY_MESSAGE_MAX_LENGTH,
  COMMUNITY_MESSAGE_PAGE_SIZE,
  COMMUNITY_REACTION_EMOJI,
  COMMUNITY_REACTION_TYPES,
  COMMUNITY_REPORT_REASONS,
  type GroupChatMessage,
  type GroupChatPage,
  type GroupChatReactionResult,
  type GroupChatReactionSummary,
  type GroupChatReportResult,
  type GroupChatThread,
  type CommunityReactionType,
  type CommunityReportReason,
} from "@/types/group-chat";

export class GroupChatError extends Error {
  constructor(
    message: string,
    readonly code: "forbidden" | "not_found" | "invalid"
  ) {
    super(message);
    this.name = "GroupChatError";
  }
}

function displayName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  email: string
): string {
  const name = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return name || email;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function sanitizeContent(raw: string): string {
  const trimmed = raw.split("\0").join("").replace(/\r\n/g, "\n").trim();
  if (!trimmed) {
    throw new GroupChatError("Enter a message.", "invalid");
  }
  if (trimmed.length > COMMUNITY_MESSAGE_MAX_LENGTH) {
    throw new GroupChatError(
      `Messages can be at most ${COMMUNITY_MESSAGE_MAX_LENGTH} characters.`,
      "invalid"
    );
  }
  return trimmed;
}

function parseReactionType(value: string | undefined): CommunityReactionType {
  const type = (value?.trim() || "heart") as CommunityReactionType;
  if (!COMMUNITY_REACTION_TYPES.includes(type)) {
    throw new GroupChatError("Choose a valid reaction.", "invalid");
  }
  return type;
}

type ChatContext = {
  userId: string;
  churchId: string;
  organizationId: string;
  groupId: string;
};

async function requireGroupChatContext(
  clerkId: string,
  groupId: string
): Promise<ChatContext> {
  if (!isPostgresUuid(groupId)) {
    throw new GroupChatError("Not found", "not_found");
  }

  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser) {
    throw new GroupChatError("Unauthorized", "forbidden");
  }

  const [group] = await db
    .select()
    .from(churchGroups)
    .where(eq(churchGroups.id, groupId))
    .limit(1);
  if (!group || group.status === "archived") {
    throw new GroupChatError("Not found", "not_found");
  }

  const churchMembership = await getChurchMembershipRow(appUser.id, group.churchId);
  if (
    !churchMembership ||
    churchMembership.status !== "active" ||
    churchMembership.organizationId !== group.organizationId
  ) {
    throw new GroupChatError("Not found", "not_found");
  }

  const [groupMembership] = await db
    .select({ id: churchGroupMemberships.id })
    .from(churchGroupMemberships)
    .where(
      and(
        eq(churchGroupMemberships.groupId, group.id),
        eq(churchGroupMemberships.userId, appUser.id),
        eq(churchGroupMemberships.organizationId, group.organizationId)
      )
    )
    .limit(1);
  if (!groupMembership) {
    throw new GroupChatError("Not found", "not_found");
  }

  return {
    userId: appUser.id,
    churchId: group.churchId,
    organizationId: group.organizationId,
    groupId: group.id,
  };
}

type MessageRow = typeof churchGroupMessages.$inferSelect;

async function getScopedMessage(
  context: ChatContext,
  messageId: string
): Promise<MessageRow> {
  if (!isPostgresUuid(messageId)) {
    throw new GroupChatError("Not found", "not_found");
  }

  const [row] = await db
    .select()
    .from(churchGroupMessages)
    .where(
      and(
        eq(churchGroupMessages.id, messageId),
        eq(churchGroupMessages.groupId, context.groupId),
        eq(churchGroupMessages.churchId, context.churchId),
        eq(churchGroupMessages.organizationId, context.organizationId)
      )
    )
    .limit(1);

  if (!row) {
    throw new GroupChatError("Not found", "not_found");
  }

  return row;
}

async function resolveThreadRoot(
  context: ChatContext,
  message: MessageRow
): Promise<MessageRow> {
  let current = message;
  for (let hop = 0; hop < 8 && current.replyToMessageId; hop += 1) {
    current = await getScopedMessage(context, current.replyToMessageId);
  }
  return current;
}

function requireOwnMessage(context: ChatContext, row: MessageRow) {
  if (row.userId !== context.userId) {
    throw new GroupChatError("Forbidden", "forbidden");
  }
}

type AuthorRow = {
  id: string;
  groupId: string;
  churchId: string;
  organizationId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  editedAt: Date | null;
  deletedAt: Date | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
};

const messageSelect = {
  id: churchGroupMessages.id,
  groupId: churchGroupMessages.groupId,
  churchId: churchGroupMessages.churchId,
  organizationId: churchGroupMessages.organizationId,
  userId: churchGroupMessages.userId,
  content: churchGroupMessages.content,
  createdAt: churchGroupMessages.createdAt,
  updatedAt: churchGroupMessages.updatedAt,
  editedAt: churchGroupMessages.editedAt,
  deletedAt: churchGroupMessages.deletedAt,
  firstName: users.firstName,
  lastName: users.lastName,
  email: users.email,
};

async function reactionSummariesFor(
  context: ChatContext,
  messageIds: string[]
): Promise<Record<string, GroupChatReactionSummary[]>> {
  const map: Record<string, GroupChatReactionSummary[]> = {};
  if (messageIds.length === 0) return map;

  const rows = await db
    .select({
      messageId: churchGroupMessageReactions.messageId,
      reactionType: churchGroupMessageReactions.reactionType,
      count: sql<number>`count(*)::int`,
      reactedByMe: sql<boolean>`bool_or(${churchGroupMessageReactions.userId} = ${context.userId})`,
    })
    .from(churchGroupMessageReactions)
    .where(
      and(
        eq(churchGroupMessageReactions.groupId, context.groupId),
        eq(churchGroupMessageReactions.churchId, context.churchId),
        eq(
          churchGroupMessageReactions.organizationId,
          context.organizationId
        ),
        inArray(churchGroupMessageReactions.messageId, messageIds)
      )
    )
    .groupBy(
      churchGroupMessageReactions.messageId,
      churchGroupMessageReactions.reactionType
    );

  for (const row of rows) {
    const type = row.reactionType as CommunityReactionType;
    if (!COMMUNITY_REACTION_TYPES.includes(type)) continue;
    const list = map[row.messageId] ?? [];
    list.push({
      type,
      emoji: COMMUNITY_REACTION_EMOJI[type],
      count: Number(row.count) || 0,
      reactedByMe: Boolean(row.reactedByMe),
    });
    map[row.messageId] = list;
  }

  for (const id of Object.keys(map)) {
    map[id]?.sort(
      (a, b) =>
        COMMUNITY_REACTION_TYPES.indexOf(a.type) -
        COMMUNITY_REACTION_TYPES.indexOf(b.type)
    );
  }
  return map;
}

async function replyCountsFor(
  context: ChatContext,
  messageIds: string[]
): Promise<Record<string, number>> {
  const map: Record<string, number> = {};
  if (messageIds.length === 0) return map;

  const rows = await db
    .select({
      parentId: churchGroupMessages.replyToMessageId,
      count: sql<number>`count(*)::int`,
    })
    .from(churchGroupMessages)
    .where(
      and(
        eq(churchGroupMessages.groupId, context.groupId),
        eq(churchGroupMessages.churchId, context.churchId),
        eq(churchGroupMessages.organizationId, context.organizationId),
        inArray(churchGroupMessages.replyToMessageId, messageIds)
      )
    )
    .groupBy(churchGroupMessages.replyToMessageId);

  for (const row of rows) {
    if (row.parentId) map[row.parentId] = Number(row.count) || 0;
  }
  return map;
}

function toMessage(
  row: AuthorRow,
  extras: {
    reactions: GroupChatReactionSummary[];
    replyCount: number;
    replyTo?: GroupChatMessage["replyTo"];
  }
): GroupChatMessage {
  const deleted = Boolean(row.deletedAt);
  const authorName = displayName(row.firstName, row.lastName, row.email);
  return {
    id: row.id,
    groupId: row.groupId,
    churchId: row.churchId,
    organizationId: row.organizationId,
    userId: row.userId,
    content: deleted ? "" : row.content,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    editedAt: row.editedAt ? row.editedAt.toISOString() : null,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    authorName,
    authorInitials: initials(authorName) || "M",
    replyTo: extras.replyTo ?? null,
    replyCount: extras.replyCount,
    reactions: extras.reactions,
  };
}

async function hydrateRows(
  context: ChatContext,
  rows: AuthorRow[],
  replyTo: GroupChatMessage["replyTo"] = null
): Promise<GroupChatMessage[]> {
  const ids = rows.map((row) => row.id);
  const [reactions, counts] = await Promise.all([
    reactionSummariesFor(context, ids),
    replyCountsFor(context, ids),
  ]);
  return rows.map((row) =>
    toMessage(row, {
      reactions: reactions[row.id] ?? [],
      replyCount: counts[row.id] ?? 0,
      replyTo,
    })
  );
}

async function hydrateInserted(
  context: ChatContext,
  inserted: MessageRow
): Promise<GroupChatMessage> {
  const [author] = await db
    .select({
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, inserted.userId))
    .limit(1);

  let replyTo: GroupChatMessage["replyTo"] = null;
  if (inserted.replyToMessageId) {
    const [parent] = await db
      .select(messageSelect)
      .from(churchGroupMessages)
      .innerJoin(users, eq(users.id, churchGroupMessages.userId))
      .where(
        and(
          eq(churchGroupMessages.id, inserted.replyToMessageId),
          eq(churchGroupMessages.groupId, context.groupId),
          eq(churchGroupMessages.churchId, context.churchId),
          eq(churchGroupMessages.organizationId, context.organizationId)
        )
      )
      .limit(1);
    if (parent) {
      replyTo = {
        id: parent.id,
        authorName: displayName(parent.firstName, parent.lastName, parent.email),
        content: parent.deletedAt ? "" : parent.content,
        deleted: Boolean(parent.deletedAt),
      };
    }
  }

  const [hydrated] = await hydrateRows(
    context,
    [
      {
        ...inserted,
        firstName: author?.firstName ?? "",
        lastName: author?.lastName ?? "",
        email: author?.email ?? "",
      },
    ],
    replyTo
  );
  if (!hydrated) {
    throw new GroupChatError("Could not load message.", "invalid");
  }
  return hydrated;
}

export async function userCanUseGroupChat(
  clerkId: string,
  groupId: string
): Promise<boolean> {
  try {
    await requireGroupChatContext(clerkId, groupId);
    return true;
  } catch {
    return false;
  }
}

export async function listGroupMessages(input: {
  clerkId: string;
  groupId: string;
  before?: string;
  limit?: number;
}): Promise<GroupChatPage> {
  const context = await requireGroupChatContext(input.clerkId, input.groupId);
  const limit = Math.min(
    Math.max(input.limit ?? COMMUNITY_MESSAGE_PAGE_SIZE, 1),
    COMMUNITY_MESSAGE_PAGE_SIZE
  );

  const beforeDate =
    input.before && !Number.isNaN(Date.parse(input.before))
      ? new Date(input.before)
      : null;

  const conditions = [
    eq(churchGroupMessages.groupId, context.groupId),
    eq(churchGroupMessages.churchId, context.churchId),
    eq(churchGroupMessages.organizationId, context.organizationId),
    isNull(churchGroupMessages.replyToMessageId),
  ];
  if (beforeDate) {
    conditions.push(lt(churchGroupMessages.createdAt, beforeDate));
  }

  const rows = await db
    .select(messageSelect)
    .from(churchGroupMessages)
    .innerJoin(users, eq(users.id, churchGroupMessages.userId))
    .where(and(...conditions))
    .orderBy(desc(churchGroupMessages.createdAt), desc(churchGroupMessages.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const messages = await hydrateRows(context, page.reverse());
  return { messages, hasMore };
}

export async function listGroupThread(input: {
  clerkId: string;
  groupId: string;
  messageId: string;
}): Promise<GroupChatThread> {
  const context = await requireGroupChatContext(input.clerkId, input.groupId);
  const scoped = await getScopedMessage(context, input.messageId);
  const rootRow = await resolveThreadRoot(context, scoped);

  const [rootAuthor] = await db
    .select(messageSelect)
    .from(churchGroupMessages)
    .innerJoin(users, eq(users.id, churchGroupMessages.userId))
    .where(
      and(
        eq(churchGroupMessages.id, rootRow.id),
        eq(churchGroupMessages.groupId, context.groupId),
        eq(churchGroupMessages.churchId, context.churchId),
        eq(churchGroupMessages.organizationId, context.organizationId)
      )
    )
    .limit(1);

  if (!rootAuthor) {
    throw new GroupChatError("Not found", "not_found");
  }

  const replyRows = await db
    .select(messageSelect)
    .from(churchGroupMessages)
    .innerJoin(users, eq(users.id, churchGroupMessages.userId))
    .where(
      and(
        eq(churchGroupMessages.replyToMessageId, rootRow.id),
        eq(churchGroupMessages.groupId, context.groupId),
        eq(churchGroupMessages.churchId, context.churchId),
        eq(churchGroupMessages.organizationId, context.organizationId)
      )
    )
    .orderBy(asc(churchGroupMessages.createdAt), asc(churchGroupMessages.id));

  const [root] = await hydrateRows(context, [rootAuthor]);
  const replies = await hydrateRows(context, replyRows, {
    id: rootAuthor.id,
    authorName: displayName(
      rootAuthor.firstName,
      rootAuthor.lastName,
      rootAuthor.email
    ),
    content: rootAuthor.deletedAt ? "" : rootAuthor.content,
    deleted: Boolean(rootAuthor.deletedAt),
  });

  if (!root) {
    throw new GroupChatError("Not found", "not_found");
  }

  return { root, replies };
}

export async function createGroupMessage(input: {
  clerkId: string;
  groupId: string;
  content: string;
  replyToMessageId?: string;
}): Promise<GroupChatMessage> {
  const context = await requireGroupChatContext(input.clerkId, input.groupId);
  const content = sanitizeContent(input.content);

  let replyToMessageId: string | null = null;
  if (input.replyToMessageId) {
    const target = await getScopedMessage(context, input.replyToMessageId);
    const root = await resolveThreadRoot(context, target);
    if (root.deletedAt) {
      throw new GroupChatError("That message was deleted.", "invalid");
    }
    replyToMessageId = root.id;
  }

  const [inserted] = await db
    .insert(churchGroupMessages)
    .values({
      organizationId: context.organizationId,
      churchId: context.churchId,
      groupId: context.groupId,
      userId: context.userId,
      content,
      replyToMessageId,
    })
    .returning();

  if (!inserted) {
    throw new GroupChatError("Could not send message.", "invalid");
  }

  return hydrateInserted(context, inserted);
}

export async function editGroupMessage(input: {
  clerkId: string;
  groupId: string;
  messageId: string;
  content: string;
}): Promise<GroupChatMessage> {
  const context = await requireGroupChatContext(input.clerkId, input.groupId);
  const existing = await getScopedMessage(context, input.messageId);
  requireOwnMessage(context, existing);
  if (existing.deletedAt) {
    throw new GroupChatError("That message was deleted.", "invalid");
  }

  const content = sanitizeContent(input.content);
  const now = new Date();
  const [updated] = await db
    .update(churchGroupMessages)
    .set({
      content,
      editedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(churchGroupMessages.id, existing.id),
        eq(churchGroupMessages.userId, context.userId),
        eq(churchGroupMessages.groupId, context.groupId),
        eq(churchGroupMessages.churchId, context.churchId),
        eq(churchGroupMessages.organizationId, context.organizationId)
      )
    )
    .returning();

  if (!updated) {
    throw new GroupChatError("Could not edit message.", "invalid");
  }

  return hydrateInserted(context, updated);
}

export async function deleteGroupMessage(input: {
  clerkId: string;
  groupId: string;
  messageId: string;
}): Promise<GroupChatMessage> {
  const context = await requireGroupChatContext(input.clerkId, input.groupId);
  const existing = await getScopedMessage(context, input.messageId);
  requireOwnMessage(context, existing);
  if (existing.deletedAt) {
    return hydrateInserted(context, existing);
  }

  const now = new Date();
  const [updated] = await db
    .update(churchGroupMessages)
    .set({
      deletedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(churchGroupMessages.id, existing.id),
        eq(churchGroupMessages.userId, context.userId),
        eq(churchGroupMessages.groupId, context.groupId),
        eq(churchGroupMessages.churchId, context.churchId),
        eq(churchGroupMessages.organizationId, context.organizationId)
      )
    )
    .returning();

  if (!updated) {
    throw new GroupChatError("Could not delete message.", "invalid");
  }

  return hydrateInserted(context, updated);
}

export async function toggleGroupReaction(input: {
  clerkId: string;
  groupId: string;
  messageId: string;
  reactionType?: string;
}): Promise<GroupChatReactionResult> {
  const context = await requireGroupChatContext(input.clerkId, input.groupId);
  const message = await getScopedMessage(context, input.messageId);
  if (message.deletedAt) {
    throw new GroupChatError("That message was deleted.", "invalid");
  }
  const reactionType = parseReactionType(input.reactionType);

  const [existing] = await db
    .select({ id: churchGroupMessageReactions.id })
    .from(churchGroupMessageReactions)
    .where(
      and(
        eq(churchGroupMessageReactions.messageId, message.id),
        eq(churchGroupMessageReactions.userId, context.userId),
        eq(churchGroupMessageReactions.reactionType, reactionType),
        eq(churchGroupMessageReactions.churchId, context.churchId),
        eq(
          churchGroupMessageReactions.organizationId,
          context.organizationId
        )
      )
    )
    .limit(1);

  if (existing) {
    await db
      .delete(churchGroupMessageReactions)
      .where(eq(churchGroupMessageReactions.id, existing.id));
  } else {
    await db.insert(churchGroupMessageReactions).values({
      organizationId: context.organizationId,
      churchId: context.churchId,
      groupId: context.groupId,
      messageId: message.id,
      userId: context.userId,
      reactionType,
    });
  }

  const map = await reactionSummariesFor(context, [message.id]);
  return {
    messageId: message.id,
    reactions: map[message.id] ?? [],
  };
}

export async function reportGroupMessage(input: {
  clerkId: string;
  groupId: string;
  messageId: string;
  reason: string;
}): Promise<GroupChatReportResult> {
  const context = await requireGroupChatContext(input.clerkId, input.groupId);
  const message = await getScopedMessage(context, input.messageId);
  if (message.userId === context.userId) {
    throw new GroupChatError("You cannot report your own message.", "invalid");
  }
  if (message.deletedAt) {
    throw new GroupChatError("That message was deleted.", "invalid");
  }

  const reason = input.reason.trim();
  if (!COMMUNITY_REPORT_REASONS.includes(reason as CommunityReportReason)) {
    throw new GroupChatError("Choose a report reason.", "invalid");
  }

  const [existing] = await db
    .select({ id: churchGroupMessageReports.id })
    .from(churchGroupMessageReports)
    .where(
      and(
        eq(churchGroupMessageReports.messageId, message.id),
        eq(churchGroupMessageReports.reporterUserId, context.userId),
        eq(churchGroupMessageReports.churchId, context.churchId),
        eq(
          churchGroupMessageReports.organizationId,
          context.organizationId
        )
      )
    )
    .limit(1);

  if (existing) {
    return { reported: true, duplicate: true };
  }

  await db.insert(churchGroupMessageReports).values({
    organizationId: context.organizationId,
    churchId: context.churchId,
    groupId: context.groupId,
    messageId: message.id,
    reporterUserId: context.userId,
    reason,
  });

  return { reported: true, duplicate: false };
}
