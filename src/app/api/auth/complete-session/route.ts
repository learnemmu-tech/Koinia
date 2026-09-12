import { NextResponse } from "next/server";

import { clerkClient } from "@clerk/nextjs/server";

import { resolveEffectiveCallbackUrl } from "@/lib/auth/resolve-effective-callback-url";
import { resolveUserMembershipRouting } from "@/lib/auth/membership-routing-server";
import { getSuperAdminBootstrapEmail } from "@/lib/auth/platform-role";
import { triggerWelcomeEmails } from "@/lib/email/triggers";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import { getAppUserByClerkId, mapAppUserToProfile } from "@/lib/postgres/app-user";
import { upsertAppUserFromClerk } from "@/lib/postgres/upsert-app-user";
import { timed } from "@/lib/perf";

type CompleteSessionBody = {
  email?: string;
  firstName?: string;
  lastName?: string;
  callbackUrl?: string;
};

/**
 * Single post-auth hop: sync Clerk → Postgres, then resolve membership routing.
 * Replaces sequential POST /api/auth/sync-profile + GET /api/auth/routing.
 */
export async function POST(request: Request) {
  const requestStarted = Date.now();
  const timings: Record<string, number> = {};

  const verified = await timed("complete-session.auth", () =>
    verifyBearerToken(request)
  );
  timings.authMs = Date.now() - requestStarted;

  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const uid = verified.uid;
  let body: CompleteSessionBody = {};
  try {
    body = (await request.json()) as CompleteSessionBody;
  } catch {
    body = {};
  }

  const existing = await timed("complete-session.existing-user", () =>
    getAppUserByClerkId(uid)
  );
  timings.userLookupMs = Date.now() - requestStarted - (timings.authMs ?? 0);

  const bootstrapEmail = getSuperAdminBootstrapEmail();
  const mayNeedBootstrap =
    Boolean(bootstrapEmail) &&
    existing?.platformRole !== "super_admin" &&
    (!existing || existing.email.trim().toLowerCase() === bootstrapEmail);

  const needsClerkRefresh =
    !existing ||
    mayNeedBootstrap ||
    Boolean(body.firstName?.trim()) ||
    Boolean(body.lastName?.trim()) ||
    !existing.email;

  let clerkEmail: string | undefined;
  let firstNameFromClerk = "";
  let lastNameFromClerk = "";
  let emailVerified = false;
  let clerkIdentityLoaded = false;

  if (needsClerkRefresh) {
    const clerkStarted = Date.now();
    try {
      const client = await clerkClient();
      const clerkUser = await timed("complete-session.clerk-getUser", () =>
        client.users.getUser(uid)
      );
      clerkEmail = clerkUser.primaryEmailAddress?.emailAddress;
      firstNameFromClerk = clerkUser.firstName ?? "";
      lastNameFromClerk = clerkUser.lastName ?? "";
      emailVerified =
        clerkUser.primaryEmailAddress?.verification?.status === "verified";
      clerkIdentityLoaded = true;
    } catch {
      // Session identity is enough when Clerk user fetch fails.
    }
    timings.clerkMs = Date.now() - clerkStarted;
  } else {
    timings.clerkMs = 0;
  }

  let profile = existing ? mapAppUserToProfile(existing) : null;

  if (!existing || mayNeedBootstrap || needsClerkRefresh) {
    const email =
      clerkEmail?.trim().toLowerCase() ||
      existing?.email.trim().toLowerCase() ||
      verified.email?.trim().toLowerCase();

    const firstName =
      body.firstName?.trim() || firstNameFromClerk || existing?.firstName || "";
    const lastName =
      body.lastName?.trim() || lastNameFromClerk || existing?.lastName || "";

    if (!email) {
      if (existing) {
        profile = mapAppUserToProfile(existing);
      } else {
        return NextResponse.json(
          { error: "Unable to sync profile because no email was available." },
          { status: 400 }
        );
      }
    } else {
      if (!clerkIdentityLoaded) {
        emailVerified = false;
      }

      const upsertStarted = Date.now();
      try {
        const syncResult = await timed("complete-session.upsert", () =>
          upsertAppUserFromClerk({
            clerkId: uid,
            email,
            firstName,
            lastName,
            emailVerified,
          })
        );
        profile = syncResult.profile;
        if (syncResult.created && email.trim()) {
          triggerWelcomeEmails({
            email: email.trim(),
            firstName,
            lastName,
            userId: uid,
          });
        }
      } catch (error) {
        console.error("[api/auth/complete-session] upsert failed", error);
        return NextResponse.json(
          { error: "Failed to save user profile." },
          { status: 500 }
        );
      }
      timings.upsertMs = Date.now() - upsertStarted;
    }
  } else {
    timings.upsertMs = 0;
  }

  if (!profile) {
    return NextResponse.json({ error: "Failed to sync profile." }, { status: 500 });
  }

  const routingStarted = Date.now();
  const callbackUrl = await resolveEffectiveCallbackUrl(body.callbackUrl ?? null);
  const routing = await timed("complete-session.routing", () =>
    resolveUserMembershipRouting(uid, callbackUrl)
  );
  timings.routingMs = Date.now() - routingStarted;
  timings.totalMs = Date.now() - requestStarted;

  console.info("[PERF] complete-session.breakdown", timings);

  return NextResponse.json({
    profile,
    routing,
    destination: routing.destination,
    _perf: timings,
  });
}
