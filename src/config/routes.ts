/**
 * Public routes — accessible without authentication.
 */
export const publicRoutes = [
  "/",
  "/about",
  "/privacy",
  "/terms",
  "/search",
  "/signin",
  "/signup",
  "/forgot-password",
  "/onboarding",
  "/waiting-approval",
  "/join",
  "/prayer-requests",
  "/events",
  "/donations",
  "/songs",
  "/sermons",
  "/articles",
];

export const authRoutes = ["/signin", "/signup", "/forgot-password"];

export const protectedRoutes = [
  "/songs",
  "/sermons",
  "/articles",
  "/profile",
  "/favorites",
  "/groups",
  "/profile/dashboard",
  "/prayer-requests/submit",
];

export const contentDetailPrefixes = ["/songs", "/articles", "/sermons"];

export const workspaceRoutes = [
  "/dashboard",
  "/admin-worship-panel",
  "/admin-panel",
  "/admin",
];

export const DEFAULT_LOGIN_REDIRECT = "/";
