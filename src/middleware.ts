import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME as AUTH_COOKIE } from "@/lib/auth-cookies";
import { isOnboardingPath } from "@/lib/auth/auth-paths";
import { isWorkspaceRoute } from "@/lib/dashboard-routes";

const AUTH_ONLY_PATHS = ["/signin", "/signup", "/forgot-password"];

const PUBLIC_CONTENT_LIST_PATHS = ["/songs", "/sermons", "/articles"];

const PROTECTED_PREFIXES = [
  "/profile",
  "/favorites",
  "/groups",
  "/profile/dashboard",
];

const PROTECTED_CONTENT_DETAIL_PREFIXES = ["/songs", "/sermons", "/articles"];

function isPathMatch(pathname: string, paths: string[]) {
  return paths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

function isProtectedPath(pathname: string) {
  if (PUBLIC_CONTENT_LIST_PATHS.includes(pathname)) return false;

  if (
    PROTECTED_CONTENT_DETAIL_PREFIXES.some((prefix) =>
      pathname.startsWith(`${prefix}/`)
    )
  ) {
    return true;
  }

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
 * Middleware performs auth-only checks. Onboarding completion and workspace access
 * are enforced client-side from Firestore via OnboardingGuard and RequireWorkspaceAccess.
 * Cookie hints may accelerate redirects but are never authoritative.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAuthenticated = req.cookies.has(AUTH_COOKIE);

  if (isOnboardingPath(pathname)) {
    if (!isAuthenticated) {
      return NextResponse.redirect(buildSignInUrl(req, pathname));
    }
    return NextResponse.next();
  }

  if (AUTH_ONLY_PATHS.some((path) => pathname === path)) {
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
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon|icon\\.png|apple-icon|images|robots.txt|manifest\\.webmanifest).*)",
  ],
};
