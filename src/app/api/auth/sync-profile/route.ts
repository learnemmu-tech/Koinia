import { NextResponse } from "next/server";

import { clerkClient } from "@clerk/nextjs/server";

import { triggerWelcomeEmails } from "@/lib/email/triggers";
import { verifyBearerToken } from "@/lib/email/verify-auth";
import { getAppUserByClerkId, mapAppUserToProfile } from "@/lib/postgres/app-user";
import { upsertAppUserFromClerk } from "@/lib/postgres/upsert-app-user";
import { timed } from "@/lib/perf";

type SyncProfileBody = {
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
  let email = verified.email;
  let displayName: string | undefined;
  let firstNameFromClerk = "";
  let lastNameFromClerk = "";
  let emailVerified = false;

  let body: SyncProfileBody = {};

  try {
    body = (await request.json()) as SyncProfileBody;
  } catch {
    body = {};
  }

  const existing = await timed("sync-profile.existing-user", () =>
    getAppUserByClerkId(uid)
  );

  const needsClerkRefresh =
    !existing ||
    Boolean(body.firstName?.trim()) ||
    Boolean(body.lastName?.trim()) ||
    !existing.email;

  if (needsClerkRefresh) {
    try {
      const client = await clerkClient();
      const clerkUser = await timed("sync-profile.clerk-getUser", () =>
        client.users.getUser(uid)
      );
      email = clerkUser.primaryEmailAddress?.emailAddress ?? email;
      firstNameFromClerk = clerkUser.firstName ?? "";
      lastNameFromClerk = clerkUser.lastName ?? "";
      displayName = [firstNameFromClerk, lastNameFromClerk]
        .filter(Boolean)
        .join(" ")
        .trim();
      emailVerified =
        clerkUser.primaryEmailAddress?.verification?.status === "verified";
    } catch {
      // Identity from the token is sufficient if Clerk user fetch fails.
    }
  }

  if (existing && !needsClerkRefresh) {
    return NextResponse.json(mapAppUserToProfile(existing));
  }

  const nameParts = (displayName ?? "").split(" ");
  const firstName =
    body.firstName?.trim() || firstNameFromClerk || existing?.firstName || nameParts[0] || "";
  const lastName =
    body.lastName?.trim() ||
    lastNameFromClerk ||
    existing?.lastName ||
    nameParts.slice(1).join(" ") ||
    "";

  let syncResult;
  try {
    syncResult = await timed("sync-profile.upsert", () =>
      upsertAppUserFromClerk({
        clerkId: uid,
        email: email ?? existing?.email ?? "",
        firstName,
        lastName,
        emailVerified,
      })
    );
  } catch (error) {
    console.error("[api/auth/sync-profile] PostgreSQL user sync failed", error);
    return NextResponse.json(
      { error: "Failed to save user profile." },
      { status: 500 }
    );
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
