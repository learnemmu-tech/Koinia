import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

import { createNavTraceId, logNavStage } from "@/lib/nav-trace";

import {
  isOnboardingPath,
  isSuperAdminPath,
  joinIntentSlugFromPath,
} from "@/lib/auth/auth-paths";
import { isWorkspaceRoute } from "@/lib/dashboard-routes";
import { churchGroupsRedirectPath } from "@/lib/templates/paths";

const AUTH_ONLY_PATHS = ["/signin", "/signup", "/forgot-password", "/sso-callback"];
const POST_AUTH_CONTINUE_PATH = "/auth/continue";

const PUBLIC_CONTENT_LIST_PATHS = [
  "/songs",
  "/sermons",
  "/articles",
  "/shorts",
  "/videos",
  "/books",
];

function isPathMatch(pathname: string, paths: string[]) {
  return paths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

const PROTECTED_PREFIXES = [
  "/profile",
  "/favorites",
  "/groups",
  "/community",
  "/profile/dashboard",
  "/me",
  "/settings",
  "/recently-viewed",
  "/shepherd",
  "/preview/website",
];

function isProtectedPath(pathname: string) {
  // Application home requires auth — logged-out visitors go to /signin.
  if (pathname === "/") return true;
  if (PUBLIC_CONTENT_LIST_PATHS.includes(pathname)) return false;
  if (/^\/books\/[^/]+\/order\/?$/.test(pathname)) return true;
  if (isPathMatch(pathname, PROTECTED_PREFIXES)) return true;
  if (pathname.startsWith("/prayer-requests/")) return true;
  return false;
}

function buildSignInUrl(req: NextRequest, callbackPath: string) {
  const signInUrl = new URL("/signin", req.url);
  signInUrl.searchParams.set("callbackUrl", callbackPath);
  return signInUrl;
}

function requestCallbackPath(req: NextRequest) {
  return `${req.nextUrl.pathname}${req.nextUrl.search}` || "/";
}

/**
 * Middleware performs auth-only checks. Onboarding completion is enforced from
 * PostgreSQL (`users.needs_church_onboarding`) via /auth/continue, OnboardingGuard,
 * and dashboard/onboarding layouts. Clerk session is identity only.
 */
function traceIdFor(req: NextRequest): string {
  return req.headers.get("x-fch-trace")?.slice(0, 16) || createNavTraceId();
}

function withTrace(
  response: NextResponse,
  traceId: string,
  req: NextRequest,
  startedAt: number,
  outcome: string
) {
  response.headers.set("x-fch-trace", traceId);
  logNavStage(traceId, "middleware", startedAt, {
    path: req.nextUrl.pathname,
    rsc: req.headers.get("rsc") === "1",
    outcome,
  });
  return response;
}

function continueRequest(
  req: NextRequest,
  traceId: string,
  startedAt: number,
  outcome: string
) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-koinia-pathname", req.nextUrl.pathname);
  requestHeaders.set("x-fch-trace", traceId);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("x-fch-trace", traceId);
  logNavStage(traceId, "middleware", startedAt, {
    path: req.nextUrl.pathname,
    rsc: req.headers.get("rsc") === "1",
    outcome,
  });
  const joinSlug = joinIntentSlugFromPath(req.nextUrl.pathname);
  if (joinSlug) {
    response.cookies.set("fc_join_slug", joinSlug, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 45 * 60,
    });
  }
  return response;
}

export default clerkMiddleware(async (auth, req) => {
  const startedAt = Date.now();
  const traceId = traceIdFor(req);
  const { pathname } = req.nextUrl;

  // Church `/groups` is an alias of Ministries. Redirect before layouts render
  // so the document is a real HTTP 307 instead of a streamed blank shell.
  const groupsDestination = churchGroupsRedirectPath(pathname);
  if (groupsDestination) {
    const url = req.nextUrl.clone();
    url.pathname = groupsDestination;
    return withTrace(NextResponse.redirect(url), traceId, req, startedAt, "groups-redirect");
  }

  // API handlers authenticate with the Clerk Bearer token. Calling auth() here
  // can handshake-redirect the request to Clerk's origin, which makes browser
  // fetch() throw TypeError: Failed to fetch.
  if (pathname.startsWith("/api/") || pathname.startsWith("/trpc/")) {
    const isFileUpload =
      pathname.startsWith("/api/upload") ||
      pathname.startsWith("/api/shorts/upload") ||
      pathname.includes("/cover") ||
      pathname.includes("/file");
    const contentType = req.headers.get("content-type") ?? "";
    const contentLength = Number(req.headers.get("content-length") ?? "0");
    if (
      !isFileUpload &&
      contentType.includes("application/json") &&
      contentLength > 2 * 1024 * 1024
    ) {
      return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    }
    return continueRequest(req, traceId, startedAt, "api-skip-auth");
  }

  const authStarted = Date.now();
  const { userId } = await auth();
  logNavStage(traceId, "middleware.auth", authStarted, {
    path: pathname,
    rsc: req.headers.get("rsc") === "1",
    signedIn: Boolean(userId),
  });
  const isAuthenticated = Boolean(userId);

  if (isOnboardingPath(pathname)) {
    if (!isAuthenticated) {
      return withTrace(
        NextResponse.redirect(buildSignInUrl(req, requestCallbackPath(req))),
        traceId,
        req,
        startedAt,
        "signin-redirect"
      );
    }
    return continueRequest(req, traceId, startedAt, "next");
  }

  if (pathname === POST_AUTH_CONTINUE_PATH || pathname.startsWith(`${POST_AUTH_CONTINUE_PATH}/`)) {
    if (!isAuthenticated) {
      return withTrace(
        NextResponse.redirect(buildSignInUrl(req, requestCallbackPath(req))),
        traceId,
        req,
        startedAt,
        "signin-redirect"
      );
    }
    return continueRequest(req, traceId, startedAt, "next");
  }

  if (AUTH_ONLY_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return continueRequest(req, traceId, startedAt, "next");
  }

  // Legacy obscure admin UI — never leave it publicly reachable.
  if (
    pathname === "/admin-secret-xyz789" ||
    pathname.startsWith("/admin-secret-xyz789/")
  ) {
    if (!isAuthenticated) {
      return withTrace(
        NextResponse.redirect(buildSignInUrl(req, "/dashboard")),
        traceId,
        req,
        startedAt,
        "signin-redirect"
      );
    }
    return withTrace(
      NextResponse.redirect(new URL("/dashboard/content?tab=songs", req.url)),
      traceId,
      req,
      startedAt,
      "legacy-admin-redirect"
    );
  }

  if (isWorkspaceRoute(pathname) || isSuperAdminPath(pathname)) {
    if (!isAuthenticated) {
      return withTrace(
        NextResponse.redirect(
          buildSignInUrl(req, `${pathname}${req.nextUrl.search}`)
        ),
        traceId,
        req,
        startedAt,
        "signin-redirect"
      );
    }
    return continueRequest(req, traceId, startedAt, "next");
  }

  if (isProtectedPath(pathname)) {
    if (!isAuthenticated) {
      return withTrace(
        NextResponse.redirect(
          buildSignInUrl(req, `${pathname}${req.nextUrl.search}`)
        ),
        traceId,
        req,
        startedAt,
        "signin-redirect"
      );
    }
    return continueRequest(req, traceId, startedAt, "next");
  }

  return continueRequest(req, traceId, startedAt, "next");
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
