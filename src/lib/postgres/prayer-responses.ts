import "server-only";

import { and, asc, count, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  prayerRequests,
  prayerResponseLikes,
  prayerResponseReports,
  prayerResponses,
  users,
} from "@/db/schema";
import { createUserNotifications } from "@/lib/postgres/features";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import { userCanAccessChurchContent } from "@/lib/postgres/session";
import { isPostgresUuid } from "@/lib/postgres/uuid";

const MAX_RESPONSE_LENGTH = 2000;
const RESPONSE_PAGE_SIZE = 20;

export type PrayerResponseItem = {
  id: string;
  parentId: string | null;
  authorId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  likedByMe: boolean;
};

async function getAccessiblePrayerRequest(
  requestId: string,
  clerkId: string,
  email?: string
) {
  if (!isPostgresUuid(requestId)) throw new Error("Prayer request not found.");
  const [request] = await db
    .select()
    .from(prayerRequests)
    .where(eq(prayerRequests.id, requestId))
    .limit(1);
  if (!request || request.status !== "approved" || !request.shareWithCommunity) {
    throw new Error("Prayer request not found.");
  }
  if (!request.churchId || !(await userCanAccessChurchContent(clerkId, email, request.churchId))) {
    throw new Error("Unauthorized");
  }
  return request;
}

async function getOwnedResponse(responseId: string, requestId: string, clerkId: string) {
  if (!isPostgresUuid(responseId) || !isPostgresUuid(requestId)) {
    throw new Error("Response not found.");
  }
  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser) throw new Error("Unauthorized");
  const [response] = await db
    .select()
    .from(prayerResponses)
    .where(
      and(
        eq(prayerResponses.id, responseId),
        eq(prayerResponses.prayerRequestId, requestId),
        eq(prayerResponses.authorId, appUser.id)
      )
    )
    .limit(1);
  if (!response) throw new Error("Unauthorized");
  return response;
}

function validateContent(content: string): string {
  const value = content.trim();
  if (!value) throw new Error("Response cannot be empty.");
  if (value.length > MAX_RESPONSE_LENGTH) {
    throw new Error(`Response must be ${MAX_RESPONSE_LENGTH} characters or fewer.`);
  }
  return value;
}

export async function listPrayerResponses(input: {
  requestId: string;
  clerkId: string;
  email?: string;
}): Promise<{ responses: PrayerResponseItem[]; total: number; hasMore: boolean }> {
  await getAccessiblePrayerRequest(input.requestId, input.clerkId, input.email);
  const appUser = await getAppUserByClerkId(input.clerkId);
  if (!appUser) throw new Error("Unauthorized");

  const rows = await db
    .select({
      id: prayerResponses.id,
      parentId: prayerResponses.parentId,
      authorId: prayerResponses.authorId,
      authorClerkId: users.clerkId,
      authorName: users.firstName,
      authorLastName: users.lastName,
      authorEmail: users.email,
      content: prayerResponses.content,
      deletedAt: prayerResponses.deletedAt,
      createdAt: prayerResponses.createdAt,
      updatedAt: prayerResponses.updatedAt,
      likeCount: count(prayerResponseLikes.id),
    })
    .from(prayerResponses)
    .innerJoin(users, eq(users.id, prayerResponses.authorId))
    .leftJoin(prayerResponseLikes, eq(prayerResponseLikes.responseId, prayerResponses.id))
    .where(eq(prayerResponses.prayerRequestId, input.requestId))
    .groupBy(
      prayerResponses.id,
      users.id,
      users.firstName,
      users.lastName,
      users.email
    )
    .orderBy(asc(prayerResponses.createdAt))
    .limit(RESPONSE_PAGE_SIZE * 5);
  const [{ value: totalValue }] = await db
    .select({ value: count(prayerResponses.id) })
    .from(prayerResponses)
    .where(eq(prayerResponses.prayerRequestId, input.requestId));

  const likedRows = rows.length
    ? await db
        .select({ responseId: prayerResponseLikes.responseId })
        .from(prayerResponseLikes)
        .where(
          and(
            inArray(
              prayerResponseLikes.responseId,
              rows.map((row) => row.id)
            ),
            eq(prayerResponseLikes.userId, appUser.id)
          )
        )
    : [];
  const liked = new Set(likedRows.map((row) => row.responseId));

  return {
    responses: rows.map((row) => ({
      id: row.id,
      parentId: row.parentId,
      authorId: row.authorClerkId ?? row.authorId,
      authorName: `${row.authorName} ${row.authorLastName}`.trim() || row.authorEmail,
      authorEmail: row.authorEmail,
      content: row.deletedAt ? "This response was deleted." : row.content,
      deleted: Boolean(row.deletedAt),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      likeCount: Number(row.likeCount),
      likedByMe: liked.has(row.id),
    })),
    total: Number(totalValue),
    hasMore: Number(totalValue) > rows.length,
  };
}

export async function createPrayerResponse(input: {
  requestId: string;
  clerkId: string;
  email?: string;
  content: string;
  parentId?: string | null;
}) {
  const request = await getAccessiblePrayerRequest(input.requestId, input.clerkId, input.email);
  const appUser = await getAppUserByClerkId(input.clerkId);
  if (!appUser) throw new Error("Unauthorized");
  const content = validateContent(input.content);
  const parentId = input.parentId?.trim() || null;

  if (parentId) {
    if (!isPostgresUuid(parentId)) throw new Error("Parent response not found.");
    const [parent] = await db
      .select({ id: prayerResponses.id })
      .from(prayerResponses)
      .where(
        and(
          eq(prayerResponses.id, parentId),
          eq(prayerResponses.prayerRequestId, request.id)
        )
      )
      .limit(1);
    if (!parent) throw new Error("Parent response not found.");
  }

  const [response] = await db
    .insert(prayerResponses)
    .values({
      prayerRequestId: request.id,
      authorId: appUser.id,
      parentId,
      content,
    })
    .returning();
  if (!response) throw new Error("Unable to create response.");

  const recipientIds = new Set<string>();
  if (request.userId && request.userId !== appUser.id) recipientIds.add(request.userId);
  if (parentId) {
    const [parent] = await db
      .select({ authorId: prayerResponses.authorId })
      .from(prayerResponses)
      .where(eq(prayerResponses.id, parentId))
      .limit(1);
    if (parent?.authorId && parent.authorId !== appUser.id) recipientIds.add(parent.authorId);
  }
  if (recipientIds.size > 0 && request.churchId && request.organizationId) {
    await createUserNotifications({
      userIds: [...recipientIds],
      type: "prayer",
      churchId: request.churchId,
      organizationId: request.organizationId,
      title: parentId ? "Someone replied to your prayer conversation" : "Someone responded to your prayer request",
      message: content,
      contentTitle: request.title,
      contentId: request.id,
    });
  }

  return response;
}

export async function updatePrayerResponse(input: {
  requestId: string;
  responseId: string;
  clerkId: string;
  email?: string;
  content: string;
}) {
  await getAccessiblePrayerRequest(input.requestId, input.clerkId, input.email);
  const response = await getOwnedResponse(input.responseId, input.requestId, input.clerkId);
  const [updated] = await db
    .update(prayerResponses)
    .set({ content: validateContent(input.content), updatedAt: new Date() })
    .where(eq(prayerResponses.id, response.id))
    .returning();
  return updated;
}

export async function deletePrayerResponse(input: {
  requestId: string;
  responseId: string;
  clerkId: string;
  email?: string;
}) {
  await getAccessiblePrayerRequest(input.requestId, input.clerkId, input.email);
  const response = await getOwnedResponse(input.responseId, input.requestId, input.clerkId);
  await db
    .update(prayerResponses)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(prayerResponses.id, response.id));
}

export async function togglePrayerResponseLike(input: {
  requestId: string;
  responseId: string;
  clerkId: string;
  email?: string;
}) {
  await getAccessiblePrayerRequest(input.requestId, input.clerkId, input.email);
  const appUser = await getAppUserByClerkId(input.clerkId);
  if (!appUser) throw new Error("Unauthorized");
  const [response] = await db
    .select({ id: prayerResponses.id, deletedAt: prayerResponses.deletedAt })
    .from(prayerResponses)
    .where(
      and(
        eq(prayerResponses.id, input.responseId),
        eq(prayerResponses.prayerRequestId, input.requestId)
      )
    )
    .limit(1);
  if (!response || response.deletedAt) throw new Error("Response not found.");

  const [existing] = await db
    .select({ id: prayerResponseLikes.id })
    .from(prayerResponseLikes)
    .where(
      and(
        eq(prayerResponseLikes.responseId, response.id),
        eq(prayerResponseLikes.userId, appUser.id)
      )
    )
    .limit(1);
  if (existing) {
    await db.delete(prayerResponseLikes).where(eq(prayerResponseLikes.id, existing.id));
  } else {
    await db.insert(prayerResponseLikes).values({ responseId: response.id, userId: appUser.id });
  }
  const [{ value }] = await db
    .select({ value: count(prayerResponseLikes.id) })
    .from(prayerResponseLikes)
    .where(eq(prayerResponseLikes.responseId, response.id));
  return { liked: !existing, likeCount: Number(value) };
}

export async function reportPrayerResponse(input: {
  requestId: string;
  responseId: string;
  clerkId: string;
  email?: string;
  reason?: string;
}) {
  await getAccessiblePrayerRequest(input.requestId, input.clerkId, input.email);
  const appUser = await getAppUserByClerkId(input.clerkId);
  if (!appUser) throw new Error("Unauthorized");
  const [response] = await db
    .select({ id: prayerResponses.id, authorId: prayerResponses.authorId })
    .from(prayerResponses)
    .where(
      and(
        eq(prayerResponses.id, input.responseId),
        eq(prayerResponses.prayerRequestId, input.requestId)
      )
    )
    .limit(1);
  if (!response) throw new Error("Response not found.");
  if (response.authorId === appUser.id) throw new Error("You cannot report your own response.");
  await db
    .insert(prayerResponseReports)
    .values({ responseId: response.id, userId: appUser.id, reason: input.reason?.trim() ?? "" })
    .onConflictDoNothing({ target: [prayerResponseReports.responseId, prayerResponseReports.userId] });
}
