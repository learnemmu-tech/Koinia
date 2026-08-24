/** Detail routes that require authentication to view content. */
export const CONTENT_DETAIL_PREFIXES = ["/songs", "/articles", "/sermons"] as const;

export function isContentDetailRoute(pathname: string): boolean {
  return CONTENT_DETAIL_PREFIXES.some((prefix) => {
    if (pathname === prefix) return false;
    return pathname.startsWith(`${prefix}/`) && pathname.length > prefix.length + 1;
  });
}
