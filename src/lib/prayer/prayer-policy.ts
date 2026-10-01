/**
 * Pure prayer-request authorization rules. No I/O: callers supply trusted,
 * server-derived facts (authenticated identity, church membership, admin role).
 * Never feed these functions values that came from the client.
 */

export type PrayerPolicyRequest = {
  /** Clerk id of the author (null for requests without an account). */
  userId?: string | null;
  churchId?: string | null;
  status: string;
  shareWithCommunity?: boolean | null;
};

export type PrayerPolicyViewer = {
  /** Authenticated Clerk id, or null for anonymous callers. */
  clerkId: string | null;
  /** Active member / admin of the church that owns the request. */
  hasChurchAccess: boolean;
  /** Church admin / editor (or platform super admin) for that church. */
  canManageChurch: boolean;
};

/** Approved and opted in to community sharing. */
export function isPrayerRequestPublic(request: PrayerPolicyRequest): boolean {
  return request.status === "approved" && request.shareWithCommunity !== false;
}

/**
 * Who may read a single prayer request (and its conversation):
 * - anonymous callers: never;
 * - church managers: every request of their church;
 * - the author: their own request;
 * - other members of the owning church: public requests only;
 * - everyone else (other churches, non-members, pending members): never.
 */
export function canReadPrayerRequest(
  request: PrayerPolicyRequest,
  viewer: PrayerPolicyViewer
): boolean {
  if (!viewer.clerkId || !request.churchId) return false;
  if (viewer.canManageChurch) return true;
  if (request.userId && request.userId === viewer.clerkId) return true;
  return viewer.hasChurchAccess && isPrayerRequestPublic(request);
}

/** Approve, reject and delete are church-admin operations only. */
export function canModeratePrayerRequest(viewer: PrayerPolicyViewer): boolean {
  return Boolean(viewer.clerkId) && viewer.canManageChurch;
}

/** Marking a request answered: the author, or a church manager. */
export function canMarkPrayerAnswered(
  request: PrayerPolicyRequest,
  viewer: PrayerPolicyViewer
): boolean {
  if (!viewer.clerkId) return false;
  if (viewer.canManageChurch) return true;
  return Boolean(request.userId) && request.userId === viewer.clerkId;
}

/** Praying for a request requires access to the church and a public request. */
export function canPrayForRequest(
  request: PrayerPolicyRequest,
  viewer: PrayerPolicyViewer
): boolean {
  if (!viewer.clerkId || !request.churchId) return false;
  return viewer.hasChurchAccess && isPrayerRequestPublic(request);
}

/** Actions that take a `userId` argument may only act for the signed-in user. */
export function isSameAuthenticatedUser(
  sessionClerkId: string | null | undefined,
  claimedUserId: string | null | undefined
): boolean {
  return Boolean(sessionClerkId) && sessionClerkId === claimedUserId;
}
