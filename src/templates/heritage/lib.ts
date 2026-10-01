import { splitEventsBySchedule } from "@/lib/event-firestore";
import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel } from "@/lib/templates/types";
import { HERITAGE_FALLBACK_IMAGES } from "@/templates/heritage/theme";

const EMPTY_ADDRESS_PART = /^(n\/?a|none|null|undefined|-+)$/i;

/** Joins the address parts that hold real values and skips placeholders such as "N/A". */
export function formatChurchAddress(model: ChurchWebsiteViewModel): string {
  return [
    model.church.address,
    model.church.city,
    model.church.state,
    model.church.country,
  ]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part) && !EMPTY_ADDRESS_PART.test(part!))
    .join(", ");
}

/** External map search for a street address. Only used when a real address exists. */
export function heritageDirectionsHref(address: string): string | null {
  const query = address.trim();
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Month, day and weekday for an ISO event date (YYYY-MM-DD), or null when unparseable. */
export function eventDateParts(eventDate: string) {
  const match = eventDate.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(date.getTime())) return null;
  return {
    month: new Intl.DateTimeFormat("en", { month: "short" }).format(date),
    day: String(date.getDate()),
    weekday: new Intl.DateTimeFormat("en", { weekday: "long" }).format(date),
  };
}

/** Published events that have not happened yet, soonest first. */
export function upcomingChurchEvents(
  events: ChurchWebsiteViewModel["events"],
  limit = 4,
  now = Date.now()
) {
  return splitEventsBySchedule(events, now).upcoming.slice(0, limit);
}

export function formatLongDate(value: string | number | Date): string {
  const date =
    typeof value === "number"
      ? new Date(value)
      : typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)
        ? new Date(`${value}T00:00:00`)
        : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function resolveHeritageImage(
  url: string | undefined,
  fallback: string = HERITAGE_FALLBACK_IMAGES.hero
): string {
  return url?.trim() || fallback;
}

/**
 * Prefer the church's own photographs, then a photographic Heritage fallback.
 * Geometric SVG placeholders are never chosen when a real image exists.
 */
export function heritageChurchPhotograph(
  model: ChurchWebsiteViewModel,
  preferred?: string,
  fallback: string = HERITAGE_FALLBACK_IMAGES.about
): string {
  return resolveHeritageImage(
    preferred?.trim() ||
      model.website.images.about ||
      model.website.images.hero ||
      model.website.images.worship,
    fallback
  );
}

export function heritageLoginHref(
  model: ChurchWebsiteViewModel,
  callbackPath?: string
) {
  const login = churchWebsitePath(model.church.slug, "/login");
  if (!callbackPath) return login;
  return `${login}?callbackUrl=${encodeURIComponent(callbackPath)}`;
}

export function heritageSignupHref(
  model: ChurchWebsiteViewModel,
  callbackPath?: string
) {
  const signup = churchWebsitePath(model.church.slug, "/signup");
  if (!callbackPath) return signup;
  return `${signup}?callbackUrl=${encodeURIComponent(callbackPath)}`;
}

export function heritageForgotPasswordHref(
  model: ChurchWebsiteViewModel,
  callbackPath?: string
) {
  const forgot = churchWebsitePath(model.church.slug, "/forgot-password");
  if (!callbackPath) return forgot;
  return `${forgot}?callbackUrl=${encodeURIComponent(callbackPath)}`;
}

/** New accounts started from a church site continue into membership join, not owner onboarding. */
export function heritageMemberSignupHref(model: ChurchWebsiteViewModel) {
  return heritageSignupHref(model, heritageJoinChurchHref(model));
}

export function heritageJoinHref(model: ChurchWebsiteViewModel, path = "/signin") {
  const callback = churchWebsitePath(model.church.slug);
  if (path === "/join") {
    return `/join/${encodeURIComponent(model.church.slug)}`;
  }
  if (path === "/signin") {
    return heritageLoginHref(model, callback);
  }
  return `${path}?callbackUrl=${encodeURIComponent(callback)}`;
}

export function heritageJoinChurchHref(model: ChurchWebsiteViewModel) {
  return `/join/${encodeURIComponent(model.church.slug)}`;
}

export function heritageJoinCta(model: ChurchWebsiteViewModel): {
  href: string;
  label: string;
} {
  return {
    href: heritageJoinChurchHref(model),
    label: "Join Our Church",
  };
}

export function heritageHeaderAuth(model: ChurchWebsiteViewModel) {
  const isMember = model.viewer.isMember;
  const isAuthenticated = model.viewer.isAuthenticated;
  return {
    isAuthenticated,
    isMember,
    churchSlug: model.church.slug,
    joinHref: heritageJoinChurchHref(model),
    joinLabel: "Join Us",
    signInHref: heritageLoginHref(model, churchWebsitePath(model.church.slug)),
    signInLabel: "Sign In",
  };
}

export type HeritageCommunityFeature = "prayer" | "chat" | "shepherd";

const COMMUNITY_FEATURE_PATH: Record<HeritageCommunityFeature, string> = {
  prayer: "/prayer",
  chat: "/community",
  shepherd: "/shepherd",
};

/**
 * Entry point for Prayer Requests, Community Chat and Shepherd AI on the church website.
 * Prayer is open to everyone. Chat and Shepherd AI are member features, so visitors are
 * sent to the church-scoped sign-in (returning to the same feature) or to the join flow.
 */
export function heritageCommunityCta(
  model: ChurchWebsiteViewModel,
  feature: HeritageCommunityFeature
): { href: string; label: string } {
  const featurePath = churchWebsitePath(
    model.church.slug,
    COMMUNITY_FEATURE_PATH[feature]
  );
  const labels = {
    prayer: { open: "Submit a request", gated: "Submit a request" },
    chat: { open: "Open Chat", gated: "chat" },
    shepherd: { open: "Chat with Shepherd AI", gated: "Shepherd AI" },
  }[feature];

  if (feature === "prayer" || model.viewer.isMember) {
    return { href: featurePath, label: labels.open };
  }
  if (!model.viewer.isAuthenticated) {
    return {
      href: heritageLoginHref(model, featurePath),
      label: `Sign in to use ${labels.gated}`,
    };
  }
  return {
    href: heritageJoinChurchHref(model),
    label: `Join to use ${labels.gated}`,
  };
}

export function heritageMemberHref(
  model: ChurchWebsiteViewModel,
  feature: "community" | "groups" | "prayer"
): string {
  if (feature === "prayer") {
    return churchWebsitePath(model.church.slug, "/prayer");
  }
  if (feature === "community") {
    return churchWebsitePath(model.church.slug, "/community");
  }
  return churchWebsitePath(model.church.slug, "/ministries");
}
