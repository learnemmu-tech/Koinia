import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { churchMemberships, churches, users } from "@/db/schema";
import { triggerMembershipApprovedNotification } from "@/lib/email/triggers";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import { mapChurchMembership } from "@/lib/postgres/mappers";
import {
  getClerkIdByUserId,
  getClerkIdsByUserIds,
} from "@/lib/postgres/session";
import type { FirebaseBranchMembership } from "@/types/branch-membership";
import type { FirebaseMembership } from "@/types/membership";
import { organizationMemberships } from "@/db/schema";
import { mapOrgMembership } from "@/lib/postgres/mappers";

export async function listOrganizationMemberships(
  organizationId: string
): Promise<FirebaseMembership[]> {
  const rows = await db
    .select()
    .from(organizationMemberships)
    .where(eq(organizationMemberships.organizationId, organizationId));

  const clerkIds = await getClerkIdsByUserIds(rows.map((row) => row.userId));
  return rows.map((row) =>
    mapOrgMembership(row, clerkIds.get(row.userId) ?? row.userId)
  );
}

export async function listBranchMembershipsForOrganization(
  organizationId: string
): Promise<FirebaseBranchMembership[]> {
  const rows = await db
    .select()
    .from(churchMemberships)
    .where(eq(churchMemberships.organizationId, organizationId));
  const clerkIds = await getClerkIdsByUserIds(rows.map((row) => row.userId));
  return rows.map((row) =>
    mapChurchMembership(row, clerkIds.get(row.userId) ?? row.userId)
  );
}

export async function getBranchMembershipForUserAndBranch(
  churchId: string,
  clerkId: string
): Promise<FirebaseBranchMembership | null> {
  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser) return null;
  const [row] = await db
    .select()
    .from(churchMemberships)
    .where(
      and(
        eq(churchMemberships.churchId, churchId),
        eq(churchMemberships.userId, appUser.id)
      )
    )
    .limit(1);
  return row ? mapChurchMembership(row, clerkId) : null;
}

export async function listPendingBranchMemberships(
  organizationId: string,
  churchId: string
): Promise<FirebaseBranchMembership[]> {
  const rows = await db
    .select()
    .from(churchMemberships)
    .where(
      and(
        eq(churchMemberships.organizationId, organizationId),
        eq(churchMemberships.churchId, churchId),
        eq(churchMemberships.status, "pending")
      )
    );
  const clerkIds = await getClerkIdsByUserIds(rows.map((row) => row.userId));
  return rows.map((row) =>
    mapChurchMembership(row, clerkIds.get(row.userId) ?? row.userId)
  );
}

export async function listActiveBranchMemberships(
  organizationId: string,
  churchId: string
): Promise<FirebaseBranchMembership[]> {
  const rows = await db
    .select()
    .from(churchMemberships)
    .where(
      and(
        eq(churchMemberships.organizationId, organizationId),
        eq(churchMemberships.churchId, churchId),
        eq(churchMemberships.status, "active")
      )
    );
  const clerkIds = await getClerkIdsByUserIds(rows.map((row) => row.userId));
  return rows.map((row) =>
    mapChurchMembership(row, clerkIds.get(row.userId) ?? row.userId)
  );
}

export async function getBranchMembershipsForUser(
  clerkId: string
): Promise<FirebaseBranchMembership[]> {
  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser) return [];
  const rows = await db
    .select()
    .from(churchMemberships)
    .where(
      and(
        eq(churchMemberships.userId, appUser.id),
        eq(churchMemberships.status, "active")
      )
    );
  return rows.map((row) => mapChurchMembership(row, clerkId));
}

export async function listAllBranchMembershipsForUser(
  clerkId: string
): Promise<FirebaseBranchMembership[]> {
  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser) return [];
  const rows = await db
    .select()
    .from(churchMemberships)
    .where(eq(churchMemberships.userId, appUser.id));
  return rows.map((row) => mapChurchMembership(row, clerkId));
}

export async function getChurchMembershipRowById(membershipId: string) {
  const [row] = await db
    .select()
    .from(churchMemberships)
    .where(eq(churchMemberships.id, membershipId))
    .limit(1);
  return row ?? null;
}

async function loadMembershipOrThrow(membershipId: string) {
  const row = await getChurchMembershipRowById(membershipId);
  if (!row) throw new Error("Membership not found");
  return row;
}

export async function approveBranchMembership(
  membershipId: string,
  _reviewerClerkId: string
): Promise<void> {
  const row = await loadMembershipOrThrow(membershipId);

  if (row.status === "active") {
    await db
      .update(users)
      .set({
        organizationId: row.organizationId,
        activeChurchId: row.churchId,
        pendingChurchId: null,
        needsChurchOnboarding: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, row.userId));
    return;
  }

  await db.transaction(async (tx) => {
    await tx
      .update(churchMemberships)
      .set({ status: "active", updatedAt: new Date() })
      .where(eq(churchMemberships.id, membershipId));

    await tx
      .update(users)
      .set({
        organizationId: row.organizationId,
        activeChurchId: row.churchId,
        pendingChurchId: null,
        needsChurchOnboarding: false,
        onboardingCompletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, row.userId));
  });

  const clerkId = await getClerkIdByUserId(row.userId);
  await triggerMembershipApprovedNotification({
    userId: clerkId ?? row.userId,
    churchId: row.churchId,
    organizationId: row.organizationId,
    branchId: row.churchId,
  });
}

export async function rejectBranchMembership(
  membershipId: string
): Promise<void> {
  const row = await loadMembershipOrThrow(membershipId);

  if (row.status === "rejected") {
    return;
  }

  await db.transaction(async (tx) => {
    await tx
      .update(churchMemberships)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(churchMemberships.id, membershipId));

    const [member] = await tx
      .select()
      .from(users)
      .where(eq(users.id, row.userId))
      .limit(1);
    if (!member) return;

    const patch: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };
    if (member.pendingChurchId === row.churchId) patch.pendingChurchId = null;
    if (member.activeChurchId === row.churchId) {
      patch.activeChurchId = null;
    }
    await tx.update(users).set(patch).where(eq(users.id, row.userId));
  });
}

export async function removeBranchMembership(
  membershipId: string,
  _removedByClerkId: string
): Promise<void> {
  const row = await loadMembershipOrThrow(membershipId);

  await db.transaction(async (tx) => {
    await tx
      .update(churchMemberships)
      .set({ status: "removed", updatedAt: new Date() })
      .where(eq(churchMemberships.id, membershipId));

    const [member] = await tx
      .select()
      .from(users)
      .where(eq(users.id, row.userId))
      .limit(1);
    if (!member) return;

    const patch: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };
    if (member.pendingChurchId === row.churchId) patch.pendingChurchId = null;
    if (member.activeChurchId === row.churchId) {
      patch.activeChurchId = null;
      if (member.organizationId === row.organizationId) {
        patch.organizationId = null;
      }
    }
    await tx.update(users).set(patch).where(eq(users.id, row.userId));
  });
}

export async function bulkReviewBranchMemberships(
  membershipIds: string[],
  action: "approve" | "reject",
  reviewerClerkId: string
): Promise<void> {
  for (const membershipId of membershipIds) {
    if (action === "approve") {
      await approveBranchMembership(membershipId, reviewerClerkId);
    } else {
      await rejectBranchMembership(membershipId);
    }
  }
}

export async function getPublicUserDirectory(
  clerkIds: string[]
): Promise<
  Record<string, { email: string; firstName: string; lastName: string }>
> {
  const ids = [...new Set(clerkIds.filter(Boolean))];
  if (ids.length === 0) return {};
  const all = await db.select().from(users).where(inArray(users.clerkId, ids));
  const result: Record<
    string,
    { email: string; firstName: string; lastName: string }
  > = {};
  for (const row of all) {
    if (!row.clerkId) continue;
    result[row.clerkId] = {
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
    };
  }
  return result;
}

export async function churchExists(churchId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: churches.id })
    .from(churches)
    .where(eq(churches.id, churchId))
    .limit(1);
  return Boolean(row);
}
