import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { churchMemberships, churches, users } from "@/db/schema";
import { getClerkIdentity } from "@/lib/email/verify-auth";
import { triggerJoinRequestNotification } from "@/lib/email/triggers";
import {
  getJoinBlockedReason,
  isPublicJoinAllowed,
} from "@/lib/enrollment";
import { DEFAULT_CHURCH_LOGO } from "@/lib/organization/onboarding-constants";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import { virtualBranchFromChurch } from "@/lib/postgres/mappers";
import { requireAppUserByClerkId } from "@/lib/postgres/session";
import type { EnrollmentMode } from "@/types/enrollment";

export type PublicChurchJoinInfo = {
  branchId: string;
  churchId: string;
  organizationId: string;
  name: string;
  slug: string;
  country?: string;
  logoUrl?: string;
  welcomeMessage?: string;
  enrollmentMode: EnrollmentMode;
  joinUrlEnabled: boolean;
  joinAvailable: boolean;
  joinBlockedReason?: string;
  slugStatus?: "active" | "retired";
};

export type PendingJoinRequest = {
  churchName: string;
  slug: string;
  branchId: string;
  status: "pending" | "active";
};

export type JoinChurchResult = {
  churchName: string;
  status: "active" | "pending";
};

async function loadChurchByJoinSlug(slug: string) {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;
  const [row] = await db
    .select()
    .from(churches)
    .where(and(eq(churches.joinSlug, normalized), eq(churches.isActive, true)))
    .limit(1);
  return row ?? null;
}

async function loadChurchByRetiredJoinSlug(slug: string) {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;
  const [row] = await db
    .select()
    .from(churches)
    .where(
      and(
        sql`${normalized} = any(${churches.retiredJoinSlugs})`,
        eq(churches.isActive, true)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function getChurchByJoinSlug(
  slug: string
): Promise<PublicChurchJoinInfo | null> {
  let church = await loadChurchByJoinSlug(slug);
  let slugStatus: "active" | "retired" = "active";

  if (!church) {
    church = await loadChurchByRetiredJoinSlug(slug);
    if (!church) return null;
    slugStatus = "retired";
  }

  const branch = virtualBranchFromChurch(church);
  const blockedReason = getJoinBlockedReason(branch.settings);
  const joinAvailable =
    slugStatus === "active" && isPublicJoinAllowed(branch.settings);

  return {
    branchId: church.id,
    churchId: church.id,
    organizationId: church.organizationId,
    name: church.name,
    slug: slug.trim().toLowerCase(),
    country: church.country?.trim() || undefined,
    logoUrl: church.logoUrl?.trim() || DEFAULT_CHURCH_LOGO,
    welcomeMessage: church.welcomeMessage?.trim() || undefined,
    enrollmentMode: church.enrollmentMode,
    joinUrlEnabled: church.joinUrlEnabled,
    joinAvailable,
    joinBlockedReason:
      slugStatus === "retired"
        ? "This invitation link is no longer valid."
        : blockedReason ?? undefined,
    slugStatus,
  };
}

export async function joinUserToChurchBySlug(
  clerkId: string,
  slug: string,
  options?: { emailVerified?: boolean }
): Promise<JoinChurchResult> {
  const church = await loadChurchByJoinSlug(slug);
  if (!church) {
    throw new Error("Church not found");
  }

  const branch = virtualBranchFromChurch(church);
  if (!isPublicJoinAllowed(branch.settings)) {
    throw new Error(
      getJoinBlockedReason(branch.settings) ??
        "This church is not accepting join requests."
    );
  }

  if (options?.emailVerified === false) {
    throw new Error("Please verify your email before joining a church.");
  }

  const appUser = await requireAppUserByClerkId(clerkId);
  const targetStatus: "active" | "pending" =
    church.enrollmentMode === "open" ? "active" : "pending";

  const [existing] = await db
    .select()
    .from(churchMemberships)
    .where(
      and(
        eq(churchMemberships.churchId, church.id),
        eq(churchMemberships.userId, appUser.id)
      )
    )
    .limit(1);

  const now = new Date();

  if (existing) {
    if (existing.status === "active") {
      await db
        .update(users)
        .set({
          organizationId: church.organizationId,
          activeChurchId: church.id,
          pendingChurchId: null,
          needsChurchOnboarding: false,
          updatedAt: now,
        })
        .where(eq(users.id, appUser.id));
      return { churchName: church.name, status: "active" };
    }

    if (existing.status === "pending") {
      await db
        .update(users)
        .set({
          pendingChurchId: church.id,
          needsChurchOnboarding: false,
          updatedAt: now,
        })
        .where(eq(users.id, appUser.id));
      return { churchName: church.name, status: "pending" };
    }

    if (existing.status !== "rejected" && existing.status !== "removed") {
      throw new Error("You cannot join this church with your current membership.");
    }

    await db
      .update(churchMemberships)
      .set({
        role: "member",
        status: targetStatus,
        updatedAt: now,
      })
      .where(eq(churchMemberships.id, existing.id));
  } else {
    await db.insert(churchMemberships).values({
      organizationId: church.organizationId,
      churchId: church.id,
      userId: appUser.id,
      role: "member",
      status: targetStatus,
    });
  }

  if (targetStatus === "active") {
    await db
      .update(users)
      .set({
        organizationId: church.organizationId,
        activeChurchId: church.id,
        pendingChurchId: null,
        needsChurchOnboarding: false,
        onboardingCompletedAt: now,
        updatedAt: now,
      })
      .where(eq(users.id, appUser.id));
    return { churchName: church.name, status: "active" };
  }

  await db
    .update(users)
    .set({
      pendingChurchId: church.id,
      needsChurchOnboarding: false,
      updatedAt: now,
    })
    .where(eq(users.id, appUser.id));

  const identity = await getClerkIdentity(clerkId);
  void triggerJoinRequestNotification({
    organizationId: church.organizationId,
    branchId: church.id,
    churchName: church.name,
    memberEmail: identity?.email ?? "",
    memberName: identity?.displayName ?? "",
    userId: clerkId,
  });

  return { churchName: church.name, status: "pending" };
}

export async function getPendingJoinRequestForUser(
  clerkId: string
): Promise<PendingJoinRequest | null> {
  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser) return null;

  const churchId = appUser.pendingChurchId ?? appUser.activeChurchId;
  if (!churchId) return null;

  const [church] = await db
    .select()
    .from(churches)
    .where(eq(churches.id, churchId))
    .limit(1);
  if (!church) return null;

  const [membership] = await db
    .select()
    .from(churchMemberships)
    .where(
      and(
        eq(churchMemberships.churchId, church.id),
        eq(churchMemberships.userId, appUser.id)
      )
    )
    .limit(1);
  if (!membership) return null;
  if (membership.status === "rejected" || membership.status === "removed") {
    return null;
  }

  return {
    churchName: church.name,
    slug: church.joinSlug,
    branchId: church.id,
    status: membership.status === "active" ? "active" : "pending",
  };
}
