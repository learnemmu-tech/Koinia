import "server-only";

import { auth } from "@clerk/nextjs/server";

import { SUPER_ADMIN_BASE } from "@/lib/auth/auth-paths";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";

/**
 * Platform SuperAdmins belong in the console, not a church workspace.
 *
 * Returns the destination instead of calling `redirect()`. Callers are entry
 * layouts, and an in-render `redirect()` from a layout crashes Next's AppRouter
 * on soft navigation (vercel/next.js#78396) — render `<ClientRedirect />` with
 * the returned path instead.
 */
export async function resolvePlatformSuperAdminWorkspaceRedirect(): Promise<
  string | null
> {
  const { userId } = await auth();
  if (!userId) return null;

  const appUser = await getAppUserByClerkId(userId);
  if (appUser && isPlatformSuperAdmin(appUser.platformRole)) {
    return SUPER_ADMIN_BASE;
  }

  return null;
}
