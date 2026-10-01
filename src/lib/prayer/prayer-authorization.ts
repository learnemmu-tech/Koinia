import "server-only";

import { auth } from "@clerk/nextjs/server";

import { getPrayerRequestById } from "@/lib/postgres/features";
import {
  userCanAccessChurchContent,
  userCanManageChurch,
} from "@/lib/postgres/session";
import { isPostgresUuid } from "@/lib/postgres/uuid";
import {
  canReadPrayerRequest,
  type PrayerPolicyViewer,
} from "@/lib/prayer/prayer-policy";
import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";

export type PrayerSession = { clerkId: string; email: string | undefined };

/** Authenticated identity from the server session. Never from client input. */
export async function getPrayerSession(): Promise<PrayerSession | null> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;
  const email =
    typeof sessionClaims?.email === "string" ? sessionClaims.email : undefined;
  return { clerkId: userId, email };
}

export async function requirePrayerSession(): Promise<PrayerSession> {
  const session = await getPrayerSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

/** Trusted membership facts about one church for the signed-in user. */
export async function resolvePrayerViewer(
  session: PrayerSession | null,
  churchId: string | null | undefined
): Promise<PrayerPolicyViewer> {
  if (!session || !churchId || !isPostgresUuid(churchId)) {
    return { clerkId: session?.clerkId ?? null, hasChurchAccess: false, canManageChurch: false };
  }
  const [hasChurchAccess, canManageChurch] = await Promise.all([
    userCanAccessChurchContent(session.clerkId, session.email, churchId),
    userCanManageChurch(session.clerkId, session.email, churchId),
  ]);
  return { clerkId: session.clerkId, hasChurchAccess, canManageChurch };
}

/** Loads a request, or null if it does not exist or is not valid to look up. */
async function loadRequest(requestId: string): Promise<FirebasePrayerRequest | null> {
  if (!isPostgresUuid(requestId)) return null;
  return getPrayerRequestById(requestId);
}

/**
 * The single server-side read gate for a prayer request. Returns null (never
 * throws, never reveals why) for anonymous callers, unknown ids and requests
 * the viewer may not read, so "missing" and "forbidden" look identical.
 */
export async function loadReadablePrayerRequest(
  requestId: string
): Promise<FirebasePrayerRequest | null> {
  const session = await getPrayerSession();
  if (!session) return null;
  const request = await loadRequest(requestId);
  if (!request) return null;
  const viewer = await resolvePrayerViewer(session, request.churchId);
  return canReadPrayerRequest(request, viewer) ? request : null;
}

/** Loads a request plus the viewer facts needed for a write decision. */
export async function loadPrayerRequestForWrite(requestId: string) {
  const session = await requirePrayerSession();
  const request = await loadRequest(requestId);
  if (!request) throw new Error("Prayer request not found.");
  const viewer = await resolvePrayerViewer(session, request.churchId);
  return { session, request, viewer };
}
