import "server-only";

import { clerkClient } from "@clerk/nextjs/server";

import { resolveEffectiveCallbackUrl } from "@/lib/auth/resolve-effective-callback-url";
import {
  resolveUserMembershipRouting,
} from "@/lib/auth/membership-routing-server";
import type { MembershipRoutingResult } from "@/lib/auth/membership-routing";
import { upsertAppUserFromClerk } from "@/lib/postgres/upsert-app-user";
import { createRequestTimer, timed } from "@/lib/perf";

/**
 * Syncs Clerk identity into PostgreSQL, including one-time SuperAdmin
 * bootstrap from a Clerk-verified primary email, then returns the post-auth path.
 */
export async function completePostAuthRouting(
  clerkUserId: string,
  callbackUrl?: string | null
): Promise<MembershipRoutingResult> {
  const timer = createRequestTimer("post-auth-continue");
  try {
    const client = await clerkClient();
    const clerkUser = await timed("post-auth.clerk-getUser", () =>
      client.users.getUser(clerkUserId)
    );
    timer.mark("clerk");
    const email = clerkUser.primaryEmailAddress?.emailAddress ?? "";

    await timed("post-auth.upsert", () =>
      upsertAppUserFromClerk({
        clerkId: clerkUserId,
        email,
        firstName: clerkUser.firstName ?? "",
        lastName: clerkUser.lastName ?? "",
        emailVerified:
          clerkUser.primaryEmailAddress?.verification?.status === "verified",
      })
    );
    timer.mark("upsert");
  } catch (error) {
    console.error("[auth] PostgreSQL user sync failed during post-auth routing", error);
  }

  const effectiveCallbackUrl = await resolveEffectiveCallbackUrl(callbackUrl);
  timer.mark("callback");
  const routing = await timed("post-auth.routing", () =>
    resolveUserMembershipRouting(clerkUserId, effectiveCallbackUrl)
  );
  timer.mark("routing");
  timer.finish();
  return routing;
}
