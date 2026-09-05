import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import type { FirestoreUser } from "@/lib/firebase-auth-service";

export type AppUserRow = typeof users.$inferSelect;

/** PostgreSQL source of truth. Schema column: `needs_church_onboarding`. */
export function isOnboardingCompleted(
  row: Pick<AppUserRow, "needsChurchOnboarding">
): boolean {
  return row.needsChurchOnboarding === false;
}

export function mapAppUserToProfile(row: AppUserRow): FirestoreUser {
  const churchId = row.activeChurchId ?? undefined;

  return {
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    role: row.platformRole === "admin" ? "admin" : "user",
    organizationId: row.organizationId ?? undefined,
    needsChurchOnboarding: row.needsChurchOnboarding,
    churchId,
    activeBranchId: churchId,
    pendingBranchId: row.pendingChurchId ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getAppUserByClerkId(
  clerkId: string
): Promise<AppUserRow | null> {
  const id = clerkId.trim();
  if (!id) return null;

  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, id))
    .limit(1);

  return row ?? null;
}

/** Marks church onboarding complete on the PostgreSQL user. Does not write orgs/churches. */
export async function markAppUserOnboardingComplete(
  clerkId: string
): Promise<void> {
  const id = clerkId.trim();
  if (!id) return;

  const now = new Date();
  await db
    .update(users)
    .set({
      needsChurchOnboarding: false,
      onboardingCompletedAt: now,
      updatedAt: now,
    })
    .where(eq(users.clerkId, id));
}
