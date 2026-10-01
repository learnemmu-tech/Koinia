import { churchWebsitePath } from "@/lib/templates/paths";
import { getPrayerRequestDisplayName } from "@/lib/prayer-request-firestore";
import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";

/** Church-scoped prayer wall routes. Members never leave `/c/{slug}`. */
export function heritagePrayerPath(slug: string) {
  return churchWebsitePath(slug, "/prayer");
}

export function heritagePrayerDetailPath(slug: string, requestId: string) {
  return churchWebsitePath(slug, `/prayer/${encodeURIComponent(requestId)}`);
}

type PrayerRequestLike = {
  churchId?: string | null;
  status: string;
  shareWithCommunity?: boolean | null;
};

/**
 * A prayer request may be shown on a church's member prayer wall only when it
 * belongs to that exact church and has been approved for community sharing.
 * Pending, rejected, private and other-church requests are never visible.
 */
export function isPrayerRequestVisibleOnChurchWall(
  request: PrayerRequestLike,
  churchId: string
): boolean {
  if (!churchId || !request.churchId) return false;
  if (request.churchId !== churchId) return false;
  return request.status === "approved" && request.shareWithCommunity !== false;
}

export function requestBelongsToChurch(
  request: { churchId?: string | null },
  churchId: string
): boolean {
  return Boolean(churchId) && request.churchId === churchId;
}

export function filterHeritagePrayerWallRequests(
  requests: FirebasePrayerRequest[],
  options: { churchId: string; search: string; category: string }
): FirebasePrayerRequest[] {
  const query = options.search.trim().toLowerCase();
  const category = options.category.trim() || "all";
  return requests.filter((request) => {
    if (!isPrayerRequestVisibleOnChurchWall(request, options.churchId)) {
      return false;
    }
    if (category !== "all" && request.category !== category) return false;
    if (!query) return true;
    const haystack = [
      request.title,
      request.request,
      getPrayerRequestDisplayName(request),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}

export type HeritagePrayerView = "wall" | "public-form";

/** Members (and church administrators) get the wall; everyone else the request form. */
export function resolveHeritagePrayerView(input: {
  isAuthenticated: boolean;
  hasChurchAccess: boolean;
}): HeritagePrayerView {
  return input.isAuthenticated && input.hasChurchAccess ? "wall" : "public-form";
}
