import "server-only";

import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import {
  ACCESS_DENIED_PATH,
  SUPER_ADMIN_BASE,
} from "@/lib/auth/auth-paths";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";
import {
  getAppUserByClerkId,
  type AppUserRow,
} from "@/lib/postgres/app-user";

/**
 * Server-only SuperAdmin gate. PostgreSQL `users.platform_role` is the
 * source of truth — never email or client-supplied roles.
 */
export const requirePlatformSuperAdmin = cache(async (): Promise<AppUserRow> => {
  const { userId } = await auth();
  if (!userId) {
    redirect(
      `/signin?callbackUrl=${encodeURIComponent(SUPER_ADMIN_BASE)}`
    );
  }

  const appUser = await getAppUserByClerkId(userId);
  if (!appUser || !isPlatformSuperAdmin(appUser.platformRole)) {
    redirect(ACCESS_DENIED_PATH);
  }

  return appUser;
});
