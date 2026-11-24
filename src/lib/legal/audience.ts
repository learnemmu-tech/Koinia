import "server-only";

import { and, eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/db";
import { churchMemberships, organizationMemberships } from "@/db/schema";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import type { LegalAudience } from "@/lib/legal/audience-types";

export type { LegalAudience };

/** Church owners, organization admins, church admins, and platform super admins. */
export async function resolveLegalAudience(): Promise<LegalAudience> {
  try {
    const { userId } = await auth();
    if (!userId) return "visitor";
    const appUser = await getAppUserByClerkId(userId);
    if (!appUser) return "visitor";
    if (isPlatformSuperAdmin(appUser.platformRole)) return "church_admin";

    const [churchAdmin] = await db
      .select({ id: churchMemberships.id })
      .from(churchMemberships)
      .where(
        and(
          eq(churchMemberships.userId, appUser.id),
          eq(churchMemberships.status, "active"),
          eq(churchMemberships.role, "church_admin")
        )
      )
      .limit(1);
    if (churchAdmin) return "church_admin";

    const [orgAdmin] = await db
      .select({ id: organizationMemberships.id })
      .from(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.userId, appUser.id),
          eq(organizationMemberships.status, "active")
        )
      )
      .limit(1);
    return orgAdmin ? "church_admin" : "visitor";
  } catch {
    return "visitor";
  }
}
