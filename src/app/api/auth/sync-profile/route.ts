import { NextResponse } from "next/server";

import { clerkClient } from "@clerk/nextjs/server";

import { triggerWelcomeEmails } from "@/lib/email/triggers";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import { getSuperAdminBootstrapEmail } from "@/lib/auth/platform-role";
import { getAppUserByClerkId, mapAppUserToProfile } from "@/lib/postgres/app-user";
import { upsertAppUserFromClerk } from "@/lib/postgres/upsert-app-user";
import { timed } from "@/lib/perf";

type SyncProfileBody = {
  email?: string;
  firstName?: string;
  lastName?: string;
};

export async function GET(request: Request) {
  const verified = await verifyBearerToken(request);
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUser = await getAppUserByClerkId(verified.uid);
  if (!appUser) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(mapAppUserToProfile(appUser));
}

export async function POST(request: Request) {
  const verified = await verifyBearerToken(request);

  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const uid = verified.uid;
  let clerkEmail: string | undefined;
  let firstNameFromClerk = "";
  let lastNameFromClerk = "";
  let emailVerified = false;
  let clerkIdentityLoaded = false;

  let body: SyncProfileBody = {};

  try {
    body = (await request.json()) as SyncProfileBody;
  } catch {
    body = {};
  }

  const existing = await timed("sync-profile.existing-user", () =>
    getAppUserByClerkId(uid)
  );

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

  if (needsClerkRefresh) {
    try {
      const client = await clerkClient();
      const clerkUser = await timed("sync-profile.clerk-getUser", () =>
        client.users.getUser(uid)
      );
      clerkEmail = clerkUser.primaryEmailAddress?.emailAddress;
      firstNameFromClerk = clerkUser.firstName ?? "";
      lastNameFromClerk = clerkUser.lastName ?? "";
      emailVerified =
        clerkUser.primaryEmailAddress?.verification?.status === "verified";
      clerkIdentityLoaded = true;
    } catch {
      // Identity from the session is sufficient if Clerk user fetch fails.
      // Never bootstrap SuperAdmin without a Clerk-verified primary email.
    }
  }

  if (existing && !mayNeedBootstrap && !needsClerkRefresh) {
    return NextResponse.json(mapAppUserToProfile(existing));
  }

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
      return NextResponse.json(mapAppUserToProfile(existing));
    }
    return NextResponse.json(
      { error: "Unable to sync profile because no email was available." },
      { status: 400 }
    );
  }

  if (!clerkIdentityLoaded) {
    emailVerified = false;
  }

  let syncResult;
  try {
    syncResult = await timed("sync-profile.upsert", () =>
      upsertAppUserFromClerk({
        clerkId: uid,
        email,
        firstName,
        lastName,
        emailVerified,
      })
    );
  } catch (error) {
    console.error("[api/auth/sync-profile] PostgreSQL user sync failed", error);
    const message =
      error instanceof Error &&
      (error.message.startsWith("Missing") ||
        error.message.startsWith("Failed to create") ||
        error.message.startsWith("Failed to update"))
        ? error.message
        : "Failed to save user profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (syncResult.created && email?.trim()) {
    triggerWelcomeEmails({
      email: email.trim(),
      firstName,
      lastName,
      userId: uid,
    });
  }

  return NextResponse.json(syncResult.profile);
}
