import "server-only";

import { auth, clerkClient, verifyToken } from "@clerk/nextjs/server";

export type VerifiedAuthUser = {
  uid: string;
  email: string | undefined;
};

export type ClerkIdentity = {
  uid: string;
  email: string | undefined;
  displayName: string;
  emailVerified: boolean;
};

function primaryEmailFromClerkUser(user: {
  primaryEmailAddress?: { emailAddress: string; verification?: { status?: string | null } | null } | null;
  emailAddresses: Array<{
    emailAddress: string;
    verification?: { status?: string | null } | null;
  }>;
}): { email: string | undefined; emailVerified: boolean } {
  const primary =
    user.primaryEmailAddress ?? user.emailAddresses[0] ?? null;
  return {
    email: primary?.emailAddress,
    emailVerified: primary?.verification?.status === "verified",
  };
}

async function identityFromUserId(uid: string): Promise<ClerkIdentity | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(uid);
    const { email, emailVerified } = primaryEmailFromClerkUser(user);
    const displayName = [user.firstName, user.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    return { uid, email, displayName, emailVerified };
  } catch {
    return null;
  }
}

export async function getClerkIdentity(
  userId: string
): Promise<ClerkIdentity | null> {
  return identityFromUserId(userId);
}

function emailFromClaims(claims: unknown): string | undefined {
  if (!claims || typeof claims !== "object") return undefined;
  const record = claims as Record<string, unknown>;
  if (typeof record.email === "string") return record.email;
  if (typeof record.primary_email_address === "string") {
    return record.primary_email_address;
  }
  return undefined;
}

export async function verifyBearerToken(
  request: Request
): Promise<VerifiedAuthUser | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  const authHeader = request.headers.get("Authorization");

  if (authHeader?.startsWith("Bearer ") && secretKey) {
    const token = authHeader.slice("Bearer ".length);
    try {
      const payload = await verifyToken(token, { secretKey });
      const uid = payload.sub;
      if (!uid) return null;

      return {
        uid,
        email: emailFromClaims(payload),
      };
    } catch {
      // Fall through to cookie session.
    }
  }

  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return null;
    return { uid: userId, email: emailFromClaims(sessionClaims) };
  } catch {
    return null;
  }
}
