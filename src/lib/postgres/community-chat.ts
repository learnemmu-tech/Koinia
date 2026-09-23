import "server-only";

import { and, asc, desc, eq, inArray, isNull, lt, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  churchCommunityMessageReactions,
  churchCommunityMessageReports,
  churchCommunityMessages,
  users,
} from "@/db/schema";
import { getActiveChurchIdFromCookies } from "@/lib/church-server";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import { getChurchMembershipRow } from "@/lib/postgres/session";
import { getChurchRowById } from "@/lib/postgres/tenants";
import { isPostgresUuid } from "@/lib/postgres/uuid";
import {
  COMMUNITY_MESSAGE_MAX_LENGTH,
  COMMUNITY_MESSAGE_PAGE_SIZE,
  COMMUNITY_REACTION_EMOJI,
  COMMUNITY_REACTION_TYPES,
  COMMUNITY_REPORT_REASONS,
  type CommunityChatMessage,
  type CommunityChatPage,
  type CommunityChatReactionResult,
  type CommunityChatReactionSummary,
  type CommunityChatReportResult,
  type CommunityChatThread,
  type CommunityReactionType,
  type CommunityReportReason,
} from "@/types/community-chat";

export class CommunityChatError extends Error {
  constructor(
    message: string,
    readonly code: "forbidden" | "not_found" | "invalid"
  ) {
    super(message);
    this.name = "CommunityChatError";
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
    throw new CommunityChatError("Enter a message.", "invalid");
  }
  if (trimmed.length > COMMUNITY_MESSAGE_MAX_LENGTH) {
    throw new CommunityChatError(
      `Messages can be at most ${COMMUNITY_MESSAGE_MAX_LENGTH} characters.`,
      "invalid"
    );
  }
  return trimmed;
}

function parseReactionType(value: string | undefined): CommunityReactionType {
  const type = (value?.trim() || "heart") as CommunityReactionType;
  if (!COMMUNITY_REACTION_TYPES.includes(type)) {
    throw new CommunityChatError("Choose a valid reaction.", "invalid");
  }
  return type;
}

type ChatContext = {
  userId: string;
  churchId: string;
  organizationId: string;
};

async function requireActiveChurchChatContext(
  clerkId: string
): Promise<ChatContext> {
  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser) {
    throw new CommunityChatError("Unauthorized", "forbidden");
  }

  const cookieChurchId = await getActiveChurchIdFromCookies();
  const churchIdCandidate =
    (cookieChurchId && isPostgresUuid(cookieChurchId) ? cookieChurchId : "") ||
    (appUser.activeChurchId && isPostgresUuid(appUser.activeChurchId)
      ? appUser.activeChurchId
      : "");

  if (!churchIdCandidate) {
    throw new CommunityChatError("Not found", "not_found");
  }

  const church = await getChurchRowById(churchIdCandidate);
  if (!church) {
    throw new CommunityChatError("Not found", "not_found");
  }

  const membership = await getChurchMembershipRow(appUser.id, church.id);
  if (
    !membership ||
    membership.status !== "active" ||
    membership.organizationId !== church.organizationId
  ) {
    throw new CommunityChatError("Not found", "not_found");
  }

  return {
    userId: appUser.id,
    churchId: church.id,
    organizationId: church.organizationId,
  };
}

type MessageRow = typeof churchCommunityMessages.$inferSelect;

async function getScopedMessage(
  context: ChatContext,
  messageId: string
): Promise<MessageRow> {
  if (!isPostgresUuid(messageId)) {
    throw new CommunityChatError("Not found", "not_found");
  }

  const [row] = await db
    .select()
    .from(churchCommunityMessages)
    .where(
      and(
        eq(churchCommunityMessages.id, messageId),
        eq(churchCommunityMessages.churchId, context.churchId),
        eq(churchCommunityMessages.organizationId, context.organizationId)
      )
    )
    .limit(1);

  if (!row) {
    throw new CommunityChatError("Not found", "not_found");
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
    throw new CommunityChatError("Forbidden", "forbidden");
  }
}

type AuthorRow = {
  id: string;
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
  id: churchCommunityMessages.id,
  churchId: churchCommunityMessages.churchId,
  organizationId: churchCommunityMessages.organizationId,
  userId: churchCommunityMessages.userId,
  content: churchCommunityMessages.content,
  createdAt: churchCommunityMessages.createdAt,
  updatedAt: churchCommunityMessages.updatedAt,
  editedAt: churchCommunityMessages.editedAt,
  deletedAt: churchCommunityMessages.deletedAt,
  firstName: users.firstName,
  lastName: users.lastName,
  email: users.email,
};

async function reactionSummariesFor(
  context: ChatContext,
  messageIds: string[]
): Promise<Record<string, CommunityChatReactionSummary[]>> {
  const map: Record<string, CommunityChatReactionSummary[]> = {};
  if (messageIds.length === 0) return map;

  const rows = await db
    .select({
      messageId: churchCommunityMessageReactions.messageId,
      reactionType: churchCommunityMessageReactions.reactionType,
      count: sql<number>`count(*)::int`,
      reactedByMe: sql<boolean>`bool_or(${churchCommunityMessageReactions.userId} = ${context.userId})`,
    })
    .from(churchCommunityMessageReactions)
    .where(
      and(
        eq(churchCommunityMessageReactions.churchId, context.churchId),
        eq(
          churchCommunityMessageReactions.organizationId,
          context.organizationId
        ),
        inArray(churchCommunityMessageReactions.messageId, messageIds)
      )
    )
    .groupBy(
      churchCommunityMessageReactions.messageId,
      churchCommunityMessageReactions.reactionType
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
      parentId: churchCommunityMessages.replyToMessageId,
      count: sql<number>`count(*)::int`,
    })
    .from(churchCommunityMessages)
    .where(
      and(
        eq(churchCommunityMessages.churchId, context.churchId),
        eq(churchCommunityMessages.organizationId, context.organizationId),
        inArray(churchCommunityMessages.replyToMessageId, messageIds)
      )
    )
    .groupBy(churchCommunityMessages.replyToMessageId);

  for (const row of rows) {
    if (row.parentId) map[row.parentId] = Number(row.count) || 0;
  }
  return map;
}

function toMessage(
  row: AuthorRow,
  extras: {
    reactions: CommunityChatReactionSummary[];
    replyCount: number;
    replyTo?: CommunityChatMessage["replyTo"];
  }
): CommunityChatMessage {
  const deleted = Boolean(row.deletedAt);
  const authorName = displayName(row.firstName, row.lastName, row.email);
  return {
    id: row.id,
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
  replyTo: CommunityChatMessage["replyTo"] = null
): Promise<CommunityChatMessage[]> {
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
): Promise<CommunityChatMessage> {
  const [author] = await db
    .select({
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, inserted.userId))
    .limit(1);

  let replyTo: CommunityChatMessage["replyTo"] = null;
  if (inserted.replyToMessageId) {
    const [parent] = await db
      .select(messageSelect)
      .from(churchCommunityMessages)
      .innerJoin(users, eq(users.id, churchCommunityMessages.userId))
      .where(
        and(
          eq(churchCommunityMessages.id, inserted.replyToMessageId),
          eq(churchCommunityMessages.churchId, context.churchId),
          eq(churchCommunityMessages.organizationId, context.organizationId)
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
    throw new CommunityChatError("Could not load message.", "invalid");
  }
  return hydrated;
}

export async function userCanUseCommunityChat(clerkId: string): Promise<boolean> {
  try {
    await requireActiveChurchChatContext(clerkId);
    return true;
  } catch {
    return false;
  }
}

export async function listCommunityMessages(input: {
  clerkId: string;
  before?: string;
  limit?: number;
}): Promise<CommunityChatPage> {
  const context = await requireActiveChurchChatContext(input.clerkId);
  const limit = Math.min(
    Math.max(input.limit ?? COMMUNITY_MESSAGE_PAGE_SIZE, 1),
    COMMUNITY_MESSAGE_PAGE_SIZE
  );

  const beforeDate =
    input.before && !Number.isNaN(Date.parse(input.before))
      ? new Date(input.before)
      : null;

  const conditions = [
    eq(churchCommunityMessages.churchId, context.churchId),
    eq(churchCommunityMessages.organizationId, context.organizationId),
    isNull(churchCommunityMessages.replyToMessageId),
  ];
  if (beforeDate) {
    conditions.push(lt(churchCommunityMessages.createdAt, beforeDate));
  }

  const rows = await db
    .select(messageSelect)
    .from(churchCommunityMessages)
    .innerJoin(users, eq(users.id, churchCommunityMessages.userId))
    .where(and(...conditions))
    .orderBy(desc(churchCommunityMessages.createdAt), desc(churchCommunityMessages.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const messages = await hydrateRows(context, page.reverse());
  return { messages, hasMore };
}

export async function listCommunityThread(input: {
  clerkId: string;
  messageId: string;
}): Promise<CommunityChatThread> {
  const context = await requireActiveChurchChatContext(input.clerkId);
  const scoped = await getScopedMessage(context, input.messageId);
  const rootRow = await resolveThreadRoot(context, scoped);

  const [rootAuthor] = await db
    .select(messageSelect)
    .from(churchCommunityMessages)
    .innerJoin(users, eq(users.id, churchCommunityMessages.userId))
    .where(
      and(
        eq(churchCommunityMessages.id, rootRow.id),
        eq(churchCommunityMessages.churchId, context.churchId),
        eq(churchCommunityMessages.organizationId, context.organizationId)
      )
    )
    .limit(1);

  if (!rootAuthor) {
    throw new CommunityChatError("Not found", "not_found");
  }

  const replyRows = await db
    .select(messageSelect)
    .from(churchCommunityMessages)
    .innerJoin(users, eq(users.id, churchCommunityMessages.userId))
    .where(
      and(
        eq(churchCommunityMessages.replyToMessageId, rootRow.id),
        eq(churchCommunityMessages.churchId, context.churchId),
        eq(churchCommunityMessages.organizationId, context.organizationId)
      )
    )
    .orderBy(asc(churchCommunityMessages.createdAt), asc(churchCommunityMessages.id));

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
    throw new CommunityChatError("Not found", "not_found");
  }

  return { root, replies };
}

export async function createCommunityMessage(input: {
  clerkId: string;
  content: string;
  replyToMessageId?: string;
}): Promise<CommunityChatMessage> {
  const context = await requireActiveChurchChatContext(input.clerkId);
  const content = sanitizeContent(input.content);

  let replyToMessageId: string | null = null;
  if (input.replyToMessageId) {
    const target = await getScopedMessage(context, input.replyToMessageId);
    const root = await resolveThreadRoot(context, target);
    if (root.deletedAt) {
      throw new CommunityChatError("That message was deleted.", "invalid");
    }
    replyToMessageId = root.id;
  }

  const [inserted] = await db
    .insert(churchCommunityMessages)
    .values({
      organizationId: context.organizationId,
      churchId: context.churchId,
      userId: context.userId,
      content,
      replyToMessageId,
    })
    .returning();

  if (!inserted) {
    throw new CommunityChatError("Could not send message.", "invalid");
  }

  return hydrateInserted(context, inserted);
}

export async function editCommunityMessage(input: {
  clerkId: string;
  messageId: string;
  content: string;
}): Promise<CommunityChatMessage> {
  const context = await requireActiveChurchChatContext(input.clerkId);
  const existing = await getScopedMessage(context, input.messageId);
  requireOwnMessage(context, existing);
  if (existing.deletedAt) {
    throw new CommunityChatError("That message was deleted.", "invalid");
  }

  const content = sanitizeContent(input.content);
  const now = new Date();
  const [updated] = await db
    .update(churchCommunityMessages)
    .set({
      content,
      editedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(churchCommunityMessages.id, existing.id),
        eq(churchCommunityMessages.userId, context.userId),
        eq(churchCommunityMessages.churchId, context.churchId),
        eq(churchCommunityMessages.organizationId, context.organizationId)
      )
    )
    .returning();

  if (!updated) {
    throw new CommunityChatError("Could not edit message.", "invalid");
  }

  return hydrateInserted(context, updated);
}

export async function deleteCommunityMessage(input: {
  clerkId: string;
  messageId: string;
}): Promise<CommunityChatMessage> {
  const context = await requireActiveChurchChatContext(input.clerkId);
  const existing = await getScopedMessage(context, input.messageId);
  requireOwnMessage(context, existing);
  if (existing.deletedAt) {
    return hydrateInserted(context, existing);
  }

  const now = new Date();
  const [updated] = await db
    .update(churchCommunityMessages)
    .set({
      deletedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(churchCommunityMessages.id, existing.id),
        eq(churchCommunityMessages.userId, context.userId),
        eq(churchCommunityMessages.churchId, context.churchId),
        eq(churchCommunityMessages.organizationId, context.organizationId)
      )
    )
    .returning();

  if (!updated) {
    throw new CommunityChatError("Could not delete message.", "invalid");
  }

  return hydrateInserted(context, updated);
}

export async function toggleCommunityReaction(input: {
  clerkId: string;
  messageId: string;
  reactionType?: string;
}): Promise<CommunityChatReactionResult> {
  const context = await requireActiveChurchChatContext(input.clerkId);
  const message = await getScopedMessage(context, input.messageId);
  if (message.deletedAt) {
    throw new CommunityChatError("That message was deleted.", "invalid");
  }
  const reactionType = parseReactionType(input.reactionType);

  const [existing] = await db
    .select({ id: churchCommunityMessageReactions.id })
    .from(churchCommunityMessageReactions)
    .where(
      and(
        eq(churchCommunityMessageReactions.messageId, message.id),
        eq(churchCommunityMessageReactions.userId, context.userId),
        eq(churchCommunityMessageReactions.reactionType, reactionType),
        eq(churchCommunityMessageReactions.churchId, context.churchId),
        eq(
          churchCommunityMessageReactions.organizationId,
          context.organizationId
        )
      )
    )
    .limit(1);

  if (existing) {
    await db
      .delete(churchCommunityMessageReactions)
      .where(eq(churchCommunityMessageReactions.id, existing.id));
  } else {
    await db.insert(churchCommunityMessageReactions).values({
      organizationId: context.organizationId,
      churchId: context.churchId,
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

export async function reportCommunityMessage(input: {
  clerkId: string;
  messageId: string;
  reason: string;
}): Promise<CommunityChatReportResult> {
  const context = await requireActiveChurchChatContext(input.clerkId);
  const message = await getScopedMessage(context, input.messageId);
  if (message.userId === context.userId) {
    throw new CommunityChatError("You cannot report your own message.", "invalid");
  }
  if (message.deletedAt) {
    throw new CommunityChatError("That message was deleted.", "invalid");
  }

  const reason = input.reason.trim();
  if (!COMMUNITY_REPORT_REASONS.includes(reason as CommunityReportReason)) {
    throw new CommunityChatError("Choose a report reason.", "invalid");
  }

  const [existing] = await db
    .select({ id: churchCommunityMessageReports.id })
    .from(churchCommunityMessageReports)
    .where(
      and(
        eq(churchCommunityMessageReports.messageId, message.id),
        eq(churchCommunityMessageReports.reporterUserId, context.userId),
        eq(churchCommunityMessageReports.churchId, context.churchId),
        eq(
          churchCommunityMessageReports.organizationId,
          context.organizationId
        )
      )
    )
    .limit(1);

  if (existing) {
    return { reported: true, duplicate: true };
  }

  await db.insert(churchCommunityMessageReports).values({
    organizationId: context.organizationId,
    churchId: context.churchId,
    messageId: message.id,
    reporterUserId: context.userId,
    reason,
  });

  return { reported: true, duplicate: false };
}
