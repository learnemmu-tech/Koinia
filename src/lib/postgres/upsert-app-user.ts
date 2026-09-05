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

function isRetryableConnectionError(error: unknown): boolean {
  const codes = new Set<string>();
  let current: unknown = error;
  for (let i = 0; i < 4 && current && typeof current === "object"; i += 1) {
    const record = current as { code?: unknown; cause?: unknown };
    if (typeof record.code === "string") codes.add(record.code);
    current = record.cause;
  }
  return (
    codes.has("ECONNRESET") ||
    codes.has("ETIMEDOUT") ||
    codes.has("ECONNREFUSED") ||
    codes.has("57P01") ||
    codes.has("57P03")
  );
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

/**
 * Idempotent identity sync: one PostgreSQL `users` row per Clerk user id.
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
    const existing = await loadByClerkId(clerkId);

    if (existing) {
      const [updated] = await db
        .update(users)
        .set({
          email,
          firstName: input.firstName,
          lastName: input.lastName,
          emailVerifiedAt: verifiedAt ?? existing.emailVerifiedAt,
          updatedAt: now,
        })
        .where(eq(users.id, existing.id))
        .returning();

      const row = updated ?? (await loadByClerkId(clerkId));
      if (!row) {
        throw new Error("Failed to update application user.");
      }

      return {
        id: row.id,
        clerkId: row.clerkId,
        created: false,
        profile: mapAppUserToProfile(row),
      };
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

      return {
        id: inserted.id,
        clerkId: inserted.clerkId,
        created: true,
        profile: mapAppUserToProfile(inserted),
      };
    } catch (error) {
      const concurrent = await loadByClerkId(clerkId);
      if (concurrent) {
        return {
          id: concurrent.id,
          clerkId: concurrent.clerkId,
          created: false,
          profile: mapAppUserToProfile(concurrent),
        };
      }

      throw error;
    }
  });
}
