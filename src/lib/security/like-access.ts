export type LikeVisibility = {
  exists: boolean;
  published: boolean;
  membersOnly: boolean;
};

/**
 * A signed-in viewer may like content they are allowed to see.
 * Unpublished content requires church management.
 * Members-only content requires access to that content's church.
 * Published public content is visible without a church membership.
 * The church id used for those checks comes from the database row.
 */
export function mayLikeContent(
  content: LikeVisibility,
  access: { hasChurchAccess: boolean; canManageChurch: boolean }
): boolean {
  if (!content.exists) return false;
  if (!content.published) return access.canManageChurch;
  if (content.membersOnly) return access.hasChurchAccess;
  return true;
}
