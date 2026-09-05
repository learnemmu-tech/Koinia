import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import {
  mapAppUserToProfile,
  type AppUserRow,
} from "@/lib/postgres/app-user";

export type AppUserIdentityInput = {
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
};

export type AppUserSyncResult = {
  id: string;
  clerkId: string | null;
  created: boolean;
  profile: ReturnType<typeof mapAppUserToProfile>;
};

function collectErrorCodes(error: unknown): Set<string> {
  const codes = new Set<string>();
  let current: unknown = error;
  for (let i = 0; i < 4 && current && typeof current === "object"; i += 1) {
    const record = current as { code?: unknown; cause?: unknown };
    if (typeof record.code === "string") codes.add(record.code);
    current = record.cause;
  }
  return codes;
}

function isRetryableConnectionError(error: unknown): boolean {
  const codes = collectErrorCodes(error);
  return (
    codes.has("ECONNRESET") ||
    codes.has("ETIMEDOUT") ||
    codes.has("ECONNREFUSED") ||
    codes.has("57P01") ||
    codes.has("57P03")
  );
}

function isUniqueViolation(error: unknown): boolean {
  return collectErrorCodes(error).has("23505");
}

async function withConnectionRetry<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!isRetryableConnectionError(error)) throw error;
    return operation();
  }
}

async function loadByClerkId(clerkId: string): Promise<AppUserRow | undefined> {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return row;
}

async function loadByEmail(email: string): Promise<AppUserRow | undefined> {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return row;
}

function toResult(row: AppUserRow, created: boolean): AppUserSyncResult {
  return {
    id: row.id,
    clerkId: row.clerkId,
    created,
    profile: mapAppUserToProfile(row),
  };
}

/**
 * Idempotent identity sync: one PostgreSQL `users` row per Clerk user id.
 * If the email already exists (legacy row / recreated Clerk user), attach
 * the current `clerk_id` instead of inserting a second row.
 * Organization, church, membership, and role fields are not written here.
 */
export async function upsertAppUserFromClerk(
  input: AppUserIdentityInput
): Promise<AppUserSyncResult> {
  const clerkId = input.clerkId.trim();
  const email = input.email.trim().toLowerCase();

  if (!clerkId) {
    throw new Error("Missing Clerk user id.");
  }
  if (!email) {
    throw new Error("Missing email for application user.");
  }

  const now = new Date();
  const verifiedAt = input.emailVerified ? now : null;

  return withConnectionRetry(async () => {
    const existing =
      (await loadByClerkId(clerkId)) ?? (await loadByEmail(email));

    if (existing) {
      const [updated] = await db
        .update(users)
        .set({
          clerkId,
          email,
          firstName: input.firstName,
          lastName: input.lastName,
          emailVerifiedAt: verifiedAt ?? existing.emailVerifiedAt,
          updatedAt: now,
        })
        .where(eq(users.id, existing.id))
        .returning();

      const row = updated ?? (await loadByClerkId(clerkId)) ?? existing;
      return toResult(row, false);
    }

    try {
      const [inserted] = await db
        .insert(users)
        .values({
          clerkId,
          email,
          firstName: input.firstName,
          lastName: input.lastName,
          emailVerifiedAt: verifiedAt,
          needsChurchOnboarding: true,
        })
        .returning();

      if (!inserted) {
        throw new Error("Failed to create application user.");
      }

      return toResult(inserted, true);
    } catch (error) {
      const concurrent =
        (await loadByClerkId(clerkId)) ??
        (isUniqueViolation(error) ? await loadByEmail(email) : undefined);

      if (concurrent) {
        const [updated] = await db
          .update(users)
          .set({
            clerkId,
            email,
            firstName: input.firstName,
            lastName: input.lastName,
            emailVerifiedAt: verifiedAt ?? concurrent.emailVerifiedAt,
            updatedAt: now,
          })
          .where(eq(users.id, concurrent.id))
          .returning();

        return toResult(updated ?? concurrent, false);
      }

      throw error;
    }
  });
}
