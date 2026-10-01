/** Layout math for the Heritage share-request modal. No DOM. */

const GUTTER_PX = 12;
const MIN_COMFORTABLE_HEIGHT_PX = 220;

export function heritageShareModalInset(input: {
  headerBottom: number;
  viewportHeight: number;
  safeBottom?: number;
}): { top: number; maxHeight: number } {
  const bottom = GUTTER_PX + Math.max(0, input.safeBottom ?? 0);
  const belowHeaderTop = Math.max(0, input.headerBottom) + GUTTER_PX;
  const belowHeaderHeight = input.viewportHeight - belowHeaderTop - bottom;

  if (belowHeaderHeight >= MIN_COMFORTABLE_HEIGHT_PX) {
    return { top: belowHeaderTop, maxHeight: belowHeaderHeight };
  }

  const compactTop = GUTTER_PX;
  return {
    top: compactTop,
    maxHeight: Math.max(0, input.viewportHeight - compactTop - bottom),
  };
}
