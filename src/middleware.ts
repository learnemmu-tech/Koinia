import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

import { isOnboardingPath } from "@/lib/auth/auth-paths";
import { isWorkspaceRoute } from "@/lib/dashboard-routes";

const AUTH_ONLY_PATHS = ["/signin", "/signup", "/forgot-password", "/sso-callback"];
const POST_AUTH_CONTINUE_PATH = "/auth/continue";

const PUBLIC_CONTENT_LIST_PATHS = ["/songs", "/sermons", "/articles", "/shorts"];

function isPathMatch(pathname: string, paths: string[]) {
  return paths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

const PROTECTED_PREFIXES = [
  "/profile",
  "/favorites",
  "/groups",
  "/profile/dashboard",
  "/me",
  "/settings",
  "/recently-viewed",
];

function isProtectedPath(pathname: string) {
  if (PUBLIC_CONTENT_LIST_PATHS.includes(pathname)) return false;
  if (isPathMatch(pathname, PROTECTED_PREFIXES)) return true;
  if (pathname.startsWith("/prayer-requests/")) return true;
  return false;
}

function buildSignInUrl(req: NextRequest, callbackPath: string) {
  const signInUrl = new URL("/signin", req.url);
  signInUrl.searchParams.set("callbackUrl", callbackPath);
  return signInUrl;
}

/**
 * Middleware performs auth-only checks. Onboarding completion is enforced from
 * PostgreSQL (`users.needs_church_onboarding`) via /auth/continue, OnboardingGuard,
 * and dashboard/onboarding layouts. Clerk session is identity only.
 */
export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  // API handlers authenticate with the Clerk Bearer token. Calling auth() here
  // can handshake-redirect the request to Clerk's origin, which makes browser
  // fetch() throw TypeError: Failed to fetch.
  if (pathname.startsWith("/api/") || pathname.startsWith("/trpc/")) {
    return NextResponse.next();
  }

  const { userId } = await auth();
  const isAuthenticated = Boolean(userId);

  if (isOnboardingPath(pathname)) {
    if (!isAuthenticated) {
      return NextResponse.redirect(buildSignInUrl(req, pathname));
    }
    return NextResponse.next();
  }

  if (pathname === POST_AUTH_CONTINUE_PATH || pathname.startsWith(`${POST_AUTH_CONTINUE_PATH}/`)) {
    if (!isAuthenticated) {
      return NextResponse.redirect(buildSignInUrl(req, pathname));
    }
    return NextResponse.next();
  }

  if (AUTH_ONLY_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  if (isWorkspaceRoute(pathname)) {
    if (!isAuthenticated) {
      return NextResponse.redirect(
        buildSignInUrl(req, `${pathname}${req.nextUrl.search}`)
      );
    }
    return NextResponse.next();
  }

  if (isProtectedPath(pathname)) {
    if (!isAuthenticated) {
      return NextResponse.redirect(
        buildSignInUrl(req, `${pathname}${req.nextUrl.search}`)
      );
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
