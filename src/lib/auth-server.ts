import { cookies } from "next/headers";

import { AUTH_COOKIE_NAME } from "@/lib/auth-cookies";

export async function isAuthenticatedServer(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.has(AUTH_COOKIE_NAME);
}
