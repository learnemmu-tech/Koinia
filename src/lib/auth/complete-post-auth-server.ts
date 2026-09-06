import "server-only";

import { clerkClient } from "@clerk/nextjs/server";

import { resolveEffectiveCallbackUrl } from "@/lib/auth/resolve-effective-callback-url";
import {
  resolveUserMembershipRouting,
} from "@/lib/auth/membership-routing-server";
import type { MembershipRoutingResult } from "@/lib/auth/membership-routing";
import { upsertAppUserFromClerk } from "@/lib/postgres/upsert-app-user";

/**
 * Syncs Clerk identity into PostgreSQL (`users.clerk_id`) without changing
 * an existing `needs_church_onboarding` value, then returns the post-auth path.
 */
export async function completePostAuthRouting(
  clerkUserId: string,
  callbackUrl?: string | null
): Promise<MembershipRoutingResult> {
  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkUserId);
    const email = clerkUser.primaryEmailAddress?.emailAddress ?? "";

    await upsertAppUserFromClerk({
      clerkId: clerkUserId,
      email,
      firstName: clerkUser.firstName ?? "",
      lastName: clerkUser.lastName ?? "",
      emailVerified:
        clerkUser.primaryEmailAddress?.verification?.status === "verified",
    });
  } catch (error) {
    console.error("[auth] PostgreSQL user sync failed during post-auth routing", error);
  }

  const effectiveCallbackUrl = await resolveEffectiveCallbackUrl(callbackUrl);
  return resolveUserMembershipRouting(clerkUserId, effectiveCallbackUrl);
}
