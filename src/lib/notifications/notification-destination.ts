import { sanitizeCallbackUrl } from "@/lib/callback-url";
import { churchWebsitePath } from "@/lib/templates/paths";
import type { NotificationContentType } from "@/types/firebase-notification";

/**
 * In-app notification destinations must be application-relative paths.
 * Absolute URLs (including localhost from a mis-set APP_URL) are reduced to
 * their pathname so the client never navigates to another origin.
 */
export function sanitizeNotificationDestination(
  raw: string | null | undefined,
  fallback = "/"
): string {
  if (!raw?.trim()) return fallback;

  let value = raw.trim();

  if (/^https?:\/\//i.test(value) || value.startsWith("//")) {
    try {
      const url = new URL(value.startsWith("//") ? `https:${value}` : value);
      value = `${url.pathname}${url.search}${url.hash}` || fallback;
    } catch {
      return fallback;
    }
  }

  return sanitizeCallbackUrl(value, fallback);
}

function heritageOrAppPath(
  input: {
    churchSlug?: string | null;
    templateId?: string | null;
  },
  listPath: string,
  contentId: string
): string {
  const slug = input.churchSlug?.trim();
  const detail = contentId
    ? `${listPath}/${encodeURIComponent(contentId)}`
    : listPath;
  if (slug && input.templateId === "heritage") {
    return churchWebsitePath(slug, detail);
  }
  return detail;
}

export function prayerNotificationPath(input: {
  contentId: string;
  churchSlug?: string | null;
  templateId?: string | null;
}): string {
  const id = input.contentId.trim();
  const slug = input.churchSlug?.trim();
  if (slug && input.templateId === "heritage") {
    return id
      ? churchWebsitePath(slug, `/prayer/${encodeURIComponent(id)}`)
      : churchWebsitePath(slug, "/prayer");
  }
  return id ? `/prayer-requests/${encodeURIComponent(id)}` : "/prayer-requests";
}

export function notificationDestination(input: {
  type: NotificationContentType;
  contentId: string;
  churchSlug?: string | null;
  templateId?: string | null;
}): string {
  const id = input.contentId.trim();

  switch (input.type) {
    case "prayer":
      return prayerNotificationPath(input);
    case "prayer_request_submitted":
      return "/dashboard/content?tab=prayers";
    case "membership_approved":
      return input.churchSlug?.trim() && input.templateId === "heritage"
        ? churchWebsitePath(input.churchSlug)
        : "/";
    case "membership_request":
      return "/dashboard/members";
    case "short_pending_review":
      return "/videos?tab=shorts";
    case "short_review_result":
      return id
        ? `/videos?tab=shorts&short=${encodeURIComponent(id)}`
        : "/videos?tab=shorts";
    case "group_invitation":
      return id ? `/groups/${encodeURIComponent(id)}` : "/community?tab=groups";
    case "trial_lifecycle":
      return "/dashboard/billing";
    case "song":
      return heritageOrAppPath(input, "/songs", id);
    case "article":
      return heritageOrAppPath(input, "/articles", id);
    case "sermon":
      return heritageOrAppPath(input, "/sermons", id);
    case "event":
      return heritageOrAppPath(input, "/events", id);
    case "book":
      return heritageOrAppPath(input, "/books", id);
    default:
      return "/";
  }
}
